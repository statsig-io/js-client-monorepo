import {
  ErrorBoundary,
  Log,
  PrecomputedEvaluationsInterface,
  SDK_VERSION,
  StatsigMetadataProvider,
  Visibility,
  _getStatsigGlobal,
  _subscribeToVisiblityChanged,
  monitorClass,
} from '@statsig/client-core';

import {
  ReplayEvent,
  ReplaySessionData,
  SessionReplayClient,
} from './SessionReplayClient';

const MAX_REPLAY_PAYLOAD_BYTES = 2048;

export function runStatsigSessionReplay(
  client: PrecomputedEvaluationsInterface,
): void {
  new SessionReplay(client);
}

export class SessionReplay {
  private _errorBoundary: ErrorBoundary;
  private _replayer: SessionReplayClient;
  private _sessionData: ReplaySessionData | null = null;
  private _events: ReplayEvent[] = [];
  private _sessionID = '';

  constructor(private _client: PrecomputedEvaluationsInterface) {
    const { sdkKey } = _client.getContext();
    this._errorBoundary = new ErrorBoundary(sdkKey);
    monitorClass(this._errorBoundary, this);

    const statsigGlobal = _getStatsigGlobal();
    statsigGlobal.srInstances = {
      ...statsigGlobal.srInstances,
      [sdkKey]: this,
    };

    this._replayer = new SessionReplayClient();
    this._client.__on('pre_shutdown', () => this._shutdown());
    this._client.__on('values_updated', () => this._attemptToStartRecording());
    this._client.__on('session_expired', () => {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._flushWithSessionID(this._sessionID);
      this._client
        .getAsyncContext()
        .then((context) => {
          this._sessionID = context.sessionID;
        })
        .catch((err) => {
          Log.error(err);
        });
    });

    _subscribeToVisiblityChanged(this._onVisibilityChanged.bind(this));

    this._client
      .getAsyncContext()
      .then((context) => {
        this._sessionID = context.sessionID;
        this._attemptToStartRecording();
      })
      .catch((err) => {
        Log.error(err);
      });
  }

  private _onVisibilityChanged(visibility: Visibility): void {
    if (visibility === 'background') {
      this._flushWithSessionID(this._sessionID);
      this._client.flush().catch((e) => {
        Log.error(e);
      });
    }
  }

  private _onRecordingEvent(event: ReplayEvent, data: ReplaySessionData) {
    this._sessionData = data;
    this._events.push(event);

    const payload = JSON.stringify(this._events);
    if (payload.length > MAX_REPLAY_PAYLOAD_BYTES) {
      if (VisibilityChangeObserver.isCurrentlyVisible()) {
        this._flushAndRefreshSessionID();
      } else {
        this._flushWithSessionID(this._sessionID);
      }
    }
  }

  private _attemptToStartRecording() {
    const values = this._client.getContext().values;

    if (values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    if (this._replayer.isRecording()) {
      return;
    }

    StatsigMetadataProvider.add({ isRecordingSession: 'true' });
    this._replayer.record((e, d) => this._onRecordingEvent(e, d));
  }

  private _shutdown() {
    this._replayer.stop();
    StatsigMetadataProvider.add({ isRecordingSession: 'false' });

    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }
    this._flushAndRefreshSessionID();
  }

  private _flushWithSessionID(sessionID: string) {
    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }
    this._logRecordingEvent(sessionID);
  }

  private _logRecordingEvent(sessionID: string) {
    const data = this._sessionData;
    if (data === null || this._events.length === 0) {
      return;
    }
    const payload = JSON.stringify(this._events);
    this._client.logEvent({
      eventName: 'statsig::session_recording',
      value: sessionID,
      metadata: {
        session_start_ts: String(data.startTime),
        session_end_ts: String(data.endTime),
        clicks_captured_cumulative: String(data.clickCount),
        rrweb_events: payload,
        session_replay_sdk_version: SDK_VERSION,
      },
    });
    this._events = [];
  }

  private _flushAndRefreshSessionID() {
    this._client
      .getAsyncContext()
      .then((context) => {
        this._logRecordingEvent(context.sessionID);
      })
      .catch((err) => {
        Log.error(err);
      });
  }
}
