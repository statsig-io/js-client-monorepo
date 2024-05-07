import {
  ErrorBoundary,
  PrecomputedEvaluationsInterface,
  SDK_VERSION,
  StatsigMetadataProvider,
  Visibility,
  _getStatsigGlobal,
  _isBrowserEnv,
  _isCurrentlyVisible,
  _subscribeToVisiblityChanged,
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
  private _replayer: SessionReplayClient;
  private _sessionData: ReplaySessionData | null = null;
  private _events: ReplayEvent[] = [];
  private _currentSessionID: Promise<string>;
  private _errorBoundary: ErrorBoundary;

  constructor(private _client: PrecomputedEvaluationsInterface) {
    const { sdkKey, errorBoundary } = _client.getContext();
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this);

    if (_isBrowserEnv()) {
      const statsigGlobal = _getStatsigGlobal();
      statsigGlobal.srInstances = {
        ...statsigGlobal.srInstances,
        [sdkKey]: this,
      };
    }

    this._currentSessionID = this._getSessionIdFromClient();

    this._replayer = new SessionReplayClient();
    this._client.$on('pre_shutdown', () => this._shutdown());
    this._client.$on('values_updated', () => this._attemptToStartRecording());
    this._client.on('session_expired', () => {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._logRecording();
      this._currentSessionID = this._getSessionIdFromClient();
    });

    this._subscribeToVisibilityChanged();
    this._attemptToStartRecording();
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

  private _onVisibilityChanged(visibility: Visibility): void {
    if (visibility === 'background') {
      this._logRecording();
      this._client.flush().catch((e) => {
        this._errorBoundary.logError('SR::visibility', e);
      });
    }
  }

  private _onRecordingEvent(event: ReplayEvent, data: ReplaySessionData) {
    this._sessionData = data;
    this._events.push(event);

    const payload = JSON.stringify(this._events);
    if (payload.length > MAX_REPLAY_PAYLOAD_BYTES) {
      if (_isCurrentlyVisible()) {
        this._bumpSessionIdleTimerAndLogRecording();
      } else {
        this._logRecording();
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
    this._bumpSessionIdleTimerAndLogRecording();
  }

  private _logRecording() {
    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }

    this._currentSessionID
      .then((sessionID) => this._logRecordingWithSessionID(sessionID))
      .catch((err) => {
        this._errorBoundary.logError('SR::flush', err);
      });
  }

  private _logRecordingWithSessionID(sessionID: string) {
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

  private _bumpSessionIdleTimerAndLogRecording() {
    this._currentSessionID = this._getSessionIdFromClient();
    this._logRecording();
  }

  private async _getSessionIdFromClient() {
    return this._client.getAsyncContext().then((x) => x.session.data.sessionID);
  }
}
