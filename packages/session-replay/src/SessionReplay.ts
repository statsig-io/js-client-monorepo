import {
  ErrorBoundary,
  Log,
  PrecomputedEvaluationsInterface,
  SDK_VERSION,
  StatsigEvent,
  StatsigMetadataProvider,
  StatsigPlugin,
  Visibility,
  _getStatsigGlobal,
  _isCurrentlyVisible,
  _isServerEnv,
  _isUnloading,
  _subscribeToVisiblityChanged,
  getUUID,
} from '@statsig/client-core';

import {
  RRWebConfig,
  ReplayEvent,
  ReplaySessionData,
  SessionReplayClient,
} from './SessionReplayClient';
import { _fastApproxSizeOf } from './SizeOf';

const REPLAY_ENQUEUE_TRIGGER_BYTES = 1024 * 10; // 10 KB
const REPLAY_SLICE_BYTES = 1024 * 1024; // 1 MB
const MAX_INDIVIDUAL_EVENT_BYTES = 1024 * 1024 * 10; // 10 MB

type SessionReplayOptions = {
  rrwebConfig?: RRWebConfig;
  forceRecording?: boolean;
};

type EndReason = 'is_leaving_page' | 'session_expired';

type RRWebPayload = {
  session_start_ts: string;
  session_end_ts: string;
  clicks_captured_cumulative: string;
  rrweb_events: string;
  rrweb_payload_size: string;
  session_replay_sdk_version: string;
  sliced_id?: string;
  slice_index?: string;
  slice_count?: string;
  slice_byte_size?: string;
  is_leaving_page?: string;
  session_expired?: string;
};

export class StatsigSessionReplayPlugin
  implements StatsigPlugin<PrecomputedEvaluationsInterface>
{
  readonly __plugin = 'session-replay';

  constructor(private readonly options?: SessionReplayOptions) {}

  bind(client: PrecomputedEvaluationsInterface): void {
    runStatsigSessionReplay(client, this.options);
  }
}

export function runStatsigSessionReplay(
  client: PrecomputedEvaluationsInterface,
  options?: SessionReplayOptions,
): void {
  new SessionReplay(client, options);
}

export class SessionReplay {
  private _replayer: SessionReplayClient;
  private _sessionData: ReplaySessionData | null = null;
  private _events: ReplayEvent[] = [];
  private _currentSessionID: string;
  private _errorBoundary: ErrorBoundary;

  constructor(
    private _client: PrecomputedEvaluationsInterface,
    private _options?: SessionReplayOptions,
  ) {
    const { sdkKey, errorBoundary } = _client.getContext();
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this);

    if (!_isServerEnv()) {
      const statsigGlobal = _getStatsigGlobal();
      statsigGlobal.srInstances = {
        ...statsigGlobal.srInstances,
        [sdkKey]: this,
      };
    }

    this._currentSessionID = this._getSessionIdFromClient();

    this._replayer = new SessionReplayClient();
    this._client.$on('pre_shutdown', () => this._shutdown());
    this._client.$on('values_updated', () =>
      this._attemptToStartRecording(this._options?.forceRecording),
    );
    this._client.on('session_expired', () => {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._logRecording('session_expired');
      this._currentSessionID = this._getSessionIdFromClient();
    });

    this._subscribeToVisibilityChanged();
    this._attemptToStartRecording(this._options?.forceRecording);
  }

  private _subscribeToVisibilityChanged() {
    // Note: this exists as a separate function to ensure closure scope only contains `sdkKey`
    const { sdkKey } = this._client.getContext();

    _subscribeToVisiblityChanged((vis) => {
      const inst = __STATSIG__?.srInstances?.[sdkKey];
      if (inst instanceof SessionReplay) {
        inst._onVisibilityChanged(vis);
      }
    });
  }

  public forceStartRecording(): void {
    this._attemptToStartRecording(true);
  }

  private _onVisibilityChanged(visibility: Visibility): void {
    if (visibility !== 'background') {
      return;
    }

    this._logRecording();
    this._client.flush().catch((e) => {
      this._errorBoundary.logError('SR::visibility', e);
    });
  }

  private _onRecordingEvent(event: ReplayEvent, data: ReplaySessionData) {
    // The session has expired so we should stop recording
    if (this._currentSessionID !== this._getSessionIdFromClient()) {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._logRecording('session_expired');
      return;
    }

    this._sessionData = data;

    const eventApproxSize = _fastApproxSizeOf(
      event,
      MAX_INDIVIDUAL_EVENT_BYTES,
    );

    if (eventApproxSize > MAX_INDIVIDUAL_EVENT_BYTES) {
      Log.warn(
        `SessionReplay event is too large (~${eventApproxSize} bytes) and will not be logged`,
        event,
      );
      return;
    }

    const approxArraySizeBefore = _fastApproxSizeOf(
      this._events,
      REPLAY_ENQUEUE_TRIGGER_BYTES,
    );
    this._events.push(event);

    if (
      approxArraySizeBefore + eventApproxSize <
      REPLAY_ENQUEUE_TRIGGER_BYTES
    ) {
      return;
    }

    if (_isCurrentlyVisible()) {
      this._bumpSessionIdleTimerAndLogRecording();
    } else {
      this._logRecording();
    }
  }

  private _attemptToStartRecording(force = false) {
    const values = this._client.getContext().values;

    if (!force && values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    if (this._replayer.isRecording()) {
      return;
    }

    StatsigMetadataProvider.add({ isRecordingSession: 'true' });
    this._replayer.record(
      (e, d) => this._onRecordingEvent(e, d),
      this._options?.rrwebConfig ?? {},
    );
  }

  private _shutdown() {
    this._replayer.stop();
    StatsigMetadataProvider.add({ isRecordingSession: 'false' });

    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }
    this._bumpSessionIdleTimerAndLogRecording();
  }

  private _logRecording(endReason?: EndReason) {
    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }

    endReason = _isUnloading() ? 'is_leaving_page' : endReason;
    this._logRecordingWithSessionID(this._currentSessionID, endReason);
  }

  private _logRecordingWithSessionID(sessionID: string, endReason?: EndReason) {
    const data = this._sessionData;
    if (data === null || this._events.length === 0) {
      return;
    }

    const payload = JSON.stringify(this._events);
    const parts = _slicePayload(payload);

    const slicedID = parts.length > 1 ? getUUID() : null;

    for (let i = 0; i < parts.length; i++) {
      const slice = parts[i];
      const event = _makeLoggableRrwebEvent(slice, payload, sessionID, data);

      if (slicedID != null) {
        _appendSlicedMetadata(
          event.metadata,
          slicedID,
          i,
          parts.length,
          slice.length,
        );
      }

      if (endReason) {
        event.metadata[endReason] = 'true';
      }

      this._client.logEvent(event);

      if (slicedID != null) {
        this._client.flush().catch((e) => {
          Log.error(e);
        });
      }
    }

    this._events = [];
  }

  private _bumpSessionIdleTimerAndLogRecording() {
    this._currentSessionID = this._getSessionIdFromClient();
    this._logRecording();
  }

  private _getSessionIdFromClient() {
    return this._client.getContext().session.data.sessionID;
  }
}

function _slicePayload(payload: string): string[] {
  const parts = [];

  for (let i = 0; i < payload.length; i += REPLAY_SLICE_BYTES) {
    parts.push(payload.slice(i, i + REPLAY_SLICE_BYTES));
  }

  return parts;
}

function _makeLoggableRrwebEvent(
  slice: string,
  payload: string,
  sessionID: string,
  data: ReplaySessionData,
): StatsigEvent & { metadata: RRWebPayload } {
  const metadata: RRWebPayload = {
    session_start_ts: String(data.startTime),
    session_end_ts: String(data.endTime),
    clicks_captured_cumulative: String(data.clickCount),

    rrweb_events: slice,
    rrweb_payload_size: String(payload.length),

    session_replay_sdk_version: SDK_VERSION,
  };

  return {
    eventName: 'statsig::session_recording',
    value: sessionID,
    metadata,
  };
}

function _appendSlicedMetadata(
  metadata: RRWebPayload,
  slicedID: string,
  sliceIndex: number,
  sliceCount: number,
  sliceByteSize: number,
) {
  metadata.sliced_id = slicedID;
  metadata.slice_index = String(sliceIndex);
  metadata.slice_count = String(sliceCount);
  metadata.slice_byte_size = String(sliceByteSize);
}
