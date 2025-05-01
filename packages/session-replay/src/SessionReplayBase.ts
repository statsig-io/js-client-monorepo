import {
  ErrorBoundary,
  Log,
  PrecomputedEvaluationsInterface,
  _getStatsigGlobal,
  _isServerEnv,
  _isUnloading,
  getUUID,
} from '@statsig/client-core';

import {
  RRWebConfig,
  ReplayEvent,
  ReplaySessionData,
} from './SessionReplayClient';
import {
  _appendSlicedMetadata,
  _makeLoggableRrwebEvent,
  _slicePayload,
} from './SessionReplayUtils';

type SessionReplayOptions = {
  rrwebConfig?: RRWebConfig;
  forceRecording?: boolean;
};

type EndReason = 'is_leaving_page' | 'session_expired';

export abstract class SessionReplayBase {
  protected _sessionData: ReplaySessionData = {
    startTime: 0,
    endTime: 0,
    clickCount: 0,
  };
  protected _events: ReplayEvent[] = [];
  protected _currentSessionID: string;
  protected _errorBoundary: ErrorBoundary;
  protected _client: PrecomputedEvaluationsInterface;
  protected _options?: SessionReplayOptions;

  constructor(
    client: PrecomputedEvaluationsInterface,
    options?: SessionReplayOptions,
  ) {
    this._client = client;
    this._options = options;
    const { sdkKey, errorBoundary } = this._client.getContext();
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
  }

  public forceStartRecording(): void {
    this._attemptToStartRecording(true);
  }

  protected abstract _attemptToStartRecording(force?: boolean): void;

  protected abstract _shutdown(): void;

  protected _logRecording(endReason?: EndReason): void {
    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }

    endReason = _isUnloading() ? 'is_leaving_page' : endReason;
    this._logRecordingWithSessionID(this._currentSessionID, endReason);
  }

  protected _logRecordingWithSessionID(
    sessionID: string,
    endReason?: EndReason,
  ): void {
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

  protected _bumpSessionIdleTimerAndLogRecording(): void {
    this._getSessionIdFromClient();
    this._logRecording();
  }

  protected _getSessionIdFromClient(): string {
    return this._client.getContext().session.data.sessionID;
  }
}
