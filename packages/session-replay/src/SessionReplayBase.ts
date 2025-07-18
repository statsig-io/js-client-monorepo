import {
  ErrorBoundary,
  Log,
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
  Visibility,
  _fastApproxSizeOf,
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
import {
  MAX_INDIVIDUAL_EVENT_BYTES,
  MAX_LOGS,
  REPLAY_ENQUEUE_TRIGGER_BYTES,
  _appendSlicedMetadata,
  _makeLoggableRrwebEvent,
  _slicePayload,
} from './SessionReplayUtils';

type SessionReplayOptions = {
  rrwebConfig?: RRWebConfig;
  forceRecording?: boolean;
};

export type EndReason = 'is_leaving_page' | 'session_expired';

export function stopRecording(sdkKey?: string): void {
  _getInstanceFromSdkKey(sdkKey)?.stopRecording();
}

export function startRecording(sdkKey?: string): void {
  _getInstanceFromSdkKey(sdkKey)?.startRecording();
}

export function forceStartRecording(sdkKey?: string): void {
  _getInstanceFromSdkKey(sdkKey)?.forceStartRecording();
}

function _getInstanceFromSdkKey(
  sdkKey?: string,
): SessionReplayBase | null | undefined {
  const inst =
    sdkKey == null
      ? _getStatsigGlobal().firstSRInstance
      : _getStatsigGlobal()?.srInstances?.[sdkKey];
  return inst instanceof SessionReplayBase ? inst : null;
}

export abstract class SessionReplayBase {
  protected _sessionData: ReplaySessionData = {
    startTime: -1,
    endTime: 0,
    clickCount: 0,
  };
  protected _events: ReplayEvent[] = [];
  protected _currentSessionID: string;
  protected _errorBoundary: ErrorBoundary;
  protected _client: PrecomputedEvaluationsInterface;
  protected _options?: SessionReplayOptions;
  protected _replayer: SessionReplayClient;
  protected _wasStopped = false;
  protected _currentEventIndex = 0;
  protected _totalLogs = 0;

  constructor(
    client: PrecomputedEvaluationsInterface,
    options?: SessionReplayOptions,
  ) {
    this._client = client;
    this._options = options;
    const { sdkKey, errorBoundary } = this._client.getContext();
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this);
    this._replayer = new SessionReplayClient();
    this._client.$on('pre_shutdown', () => this._shutdown());
    this._client.on('session_expired', () => {
      this._shutdown('session_expired');
    });

    if (!_isServerEnv()) {
      const statsigGlobal = _getStatsigGlobal();
      statsigGlobal.srInstances = {
        ...statsigGlobal.srInstances,
        [sdkKey]: this,
      };
      if (!statsigGlobal.firstSRInstance) {
        statsigGlobal.firstSRInstance = this;
      }
    }

    this._currentSessionID = this._getSessionIdFromClient();
    this._subscribeToVisibilityChanged();
  }

  public forceStartRecording(): void {
    this._wasStopped = false;
    this._attemptToStartRecording(true);
  }

  public stopRecording(): void {
    this._wasStopped = true;
    this._shutdown();
  }

  public startRecording(): void {
    this._wasStopped = false;
    this._attemptToStartRecording(this._options?.forceRecording);
  }

  public isRecording(): boolean {
    return this._replayer.isRecording();
  }

  protected abstract _attemptToStartRecording(force?: boolean): void;

  protected _logRecording(endReason?: EndReason): void {
    if (this._events.length === 0) {
      return;
    }

    endReason = _isUnloading() ? 'is_leaving_page' : endReason;
    this._logRecordingWithSessionID(this._currentSessionID, endReason);
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

  protected _subscribeToVisibilityChanged(): void {
    // Note: this exists as a separate function to ensure closure scope only contains `sdkKey`
    const { sdkKey } = this._client.getContext();

    _subscribeToVisiblityChanged((vis) => {
      const inst = _getStatsigGlobal()?.srInstances?.[sdkKey];
      if (inst instanceof SessionReplayBase) {
        inst._onVisibilityChanged(vis);
      }
    });
  }

  protected _logRecordingWithSessionID(
    sessionID: string,
    endReason?: EndReason,
  ): void {
    const data = this._sessionData;
    if (this._events.length === 0) {
      return;
    }

    const payload = JSON.stringify(this._events);
    const parts = _slicePayload(payload);

    const slicedID = parts.length > 1 ? getUUID() : null;

    for (let i = 0; i < parts.length; i++) {
      const slice = parts[i];
      const event = _makeLoggableRrwebEvent(
        slice,
        payload,
        sessionID,
        data,
        this._client.getContext().sdkInstanceID,
      );

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

      this._totalLogs++;

      this._client.logEvent(event);

      if (slicedID != null) {
        this._client.flush().catch((e) => {
          Log.error(e);
        });
      }
    }

    this._events = [];
    if (this._totalLogs > MAX_LOGS) {
      this._shutdown();
    }
  }

  protected _bumpSessionIdleTimerAndLogRecording(): void {
    this._getSessionIdFromClient();
    this._logRecording();
  }

  protected _getSessionIdFromClient(): string {
    return this._client.getContext().session.data.sessionID;
  }

  protected abstract _shutdown(endReason?: EndReason): void;

  protected _shutdownImpl(endReason?: EndReason): void {
    if (this._replayer.isRecording()) {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
    }

    if (this._events.length === 0) {
      // only reset if session expired otherwise we might start recording again
      if (endReason === 'session_expired') {
        this._currentEventIndex = 0;
        this._sessionData = this._makeEmptySessionData();
      }
      return;
    }
    this._logRecording(endReason);
    // only reset if session expired otherwise we might start recording again
    if (endReason === 'session_expired') {
      this._currentEventIndex = 0;
      this._sessionData = this._makeEmptySessionData();
    }
  }

  private _makeEmptySessionData(): ReplaySessionData {
    return {
      startTime: -1,
      endTime: 0,
      clickCount: 0,
    };
  }

  protected _onRecordingEvent(
    event: ReplayEvent,
    data: ReplaySessionData,
  ): void {
    // The session has expired so we should stop recording
    if (this._currentSessionID !== this._getSessionIdFromClient()) {
      this._shutdown('session_expired');
      return;
    }

    if (this._totalLogs >= MAX_LOGS) {
      this._shutdown();
      return;
    }

    event.eventIndex = this._currentEventIndex++;

    // Update the session data
    this._sessionData.clickCount += data.clickCount;
    this._sessionData.startTime =
      this._sessionData.startTime === -1
        ? data.startTime
        : Math.min(this._sessionData.startTime, data.startTime);
    this._sessionData.endTime = Math.max(
      this._sessionData.endTime,
      data.endTime,
    );

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
}
