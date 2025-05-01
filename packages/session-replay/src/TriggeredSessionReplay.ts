import {
  Log,
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
  StatsigPlugin,
  Visibility,
  _getStatsigGlobal,
  _isCurrentlyVisible,
  _subscribeToVisiblityChanged,
} from '@statsig/client-core';

import { SessionReplayBase } from './SessionReplayBase';
import {
  RRWebConfig,
  ReplayEvent,
  ReplaySessionData,
} from './SessionReplayClient';
import {
  MAX_INDIVIDUAL_EVENT_BYTES,
  REPLAY_ENQUEUE_TRIGGER_BYTES,
} from './SessionReplayUtils';
import { _fastApproxSizeOf } from './SizeOf';
import { TriggeredSessionReplayClient } from './TriggeredSessionReplayClient';

type SessionReplayOptions = {
  rrwebConfig?: RRWebConfig;
  forceRecording?: boolean;
};

export class StatsigTriggeredSessionReplayPlugin
  implements StatsigPlugin<PrecomputedEvaluationsInterface>
{
  readonly __plugin = 'triggered-session-replay';

  constructor(private readonly options?: SessionReplayOptions) {}

  bind(client: PrecomputedEvaluationsInterface): void {
    runStatsigSessionReplay(client, this.options);
  }
}

export function runStatsigSessionReplay(
  client: PrecomputedEvaluationsInterface,
  options?: SessionReplayOptions,
): void {
  new TriggeredSessionReplay(client, options);
}

export function startRecording(sdkKey: string): void {
  const inst = _getStatsigGlobal()?.srInstances?.[sdkKey];
  if (inst instanceof TriggeredSessionReplay) {
    inst.startRecording();
  }
}

export function stopRecording(sdkKey: string): void {
  const inst = _getStatsigGlobal()?.srInstances?.[sdkKey];
  if (inst instanceof TriggeredSessionReplay) {
    inst.stopRecording();
  }
}

export class TriggeredSessionReplay extends SessionReplayBase {
  private _replayer: TriggeredSessionReplayClient;
  private _currentEventIndex = 0;

  private _runningEventData: {
    events: { event: ReplayEvent; data: ReplaySessionData }[];
  }[] = [];
  private _isActiveRecording = false;
  private _wasStopped = false;

  constructor(
    client: PrecomputedEvaluationsInterface,
    options?: SessionReplayOptions,
  ) {
    super(client, options);

    this._replayer = new TriggeredSessionReplayClient();
    this._client.$on('pre_shutdown', () => this._shutdown());
    this._client.$on('values_updated', () => {
      if (!this._wasStopped) {
        this._attemptToStartRecording(this._options?.forceRecording);
      }
    });
    this._client.on('session_expired', () => {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._logRecording('session_expired');
    });

    this._subscribeToVisibilityChanged();
    this._attemptToStartRecording(this._options?.forceRecording);
  }

  protected _subscribeToVisibilityChanged(): void {
    // Note: this exists as a separate function to ensure closure scope only contains `sdkKey`
    const { sdkKey } = this._client.getContext();

    _subscribeToVisiblityChanged((vis) => {
      const inst = _getStatsigGlobal()?.srInstances?.[sdkKey];
      if (inst instanceof TriggeredSessionReplay) {
        inst._onVisibilityChanged(vis);
      }
    });
  }

  public startRecording(): void {
    this._wasStopped = false;
    const currentEvents = this._runningEventData.map((e) => e.events).flat();
    for (let i = 0; i < currentEvents.length; i++) {
      currentEvents[i].event.eventIndex = i;
      this._sessionData.clickCount += currentEvents[i].data.clickCount;
      this._sessionData.startTime = Math.min(
        this._sessionData.startTime,
        currentEvents[i].data.startTime,
      );
      this._sessionData.endTime = Math.max(
        this._sessionData.endTime,
        currentEvents[i].data.endTime,
      );
    }
    this._events = currentEvents.map((e) => e.event);
    this._currentEventIndex = currentEvents.length;
    this._isActiveRecording = true;
    if (_isCurrentlyVisible()) {
      this._bumpSessionIdleTimerAndLogRecording();
    } else {
      this._logRecording();
    }
    this._attemptToStartRecording(this._options?.forceRecording);
  }

  public stopRecording(): void {
    this._wasStopped = true;
    this._replayer.stop();
    StatsigMetadataProvider.add({ isRecordingSession: 'false' });
    this._isActiveRecording = false;
    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }
    this._logRecording();
  }

  protected _onVisibilityChanged(visibility: Visibility): void {
    if (visibility !== 'background') {
      return;
    }

    this._logRecording();
    this._client.flush().catch((e) => {
      this._errorBoundary.logError('SR::visibility', e);
    });
  }

  protected _onRecordingEvent(
    event: ReplayEvent,
    data: ReplaySessionData,
    isCheckOut: boolean,
  ): void {
    if (!this._isActiveRecording) {
      // The session has expired so we should stop recording
      if (this._currentSessionID !== this._getSessionIdFromClient()) {
        this._replayer.stop();
        StatsigMetadataProvider.add({ isRecordingSession: 'false' });
        this._runningEventData = [];
        return;
      }

      if (
        (isCheckOut && event.type === 4) || // Type 4 and type 2 both show up as checkout events but we only want to start a new entry for type 4
        this._runningEventData.length === 0
      ) {
        // We only want to keep two entries
        if (this._runningEventData.length > 1) {
          this._runningEventData.shift();
        }
        this._runningEventData.push({ events: [{ event, data }] });
      } else {
        this._runningEventData[this._runningEventData.length - 1].events.push({
          event,
          data,
        });
      }
      return;
    }

    // The session has expired so we should stop recording
    if (this._currentSessionID !== this._getSessionIdFromClient()) {
      this._replayer.stop();
      StatsigMetadataProvider.add({ isRecordingSession: 'false' });
      this._logRecording('session_expired');
      return;
    }

    event.eventIndex = this._currentEventIndex++;

    // Update the session data
    this._sessionData.clickCount += data.clickCount;
    this._sessionData.startTime = Math.min(
      this._sessionData.startTime,
      data.startTime,
    );
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

  protected _attemptToStartRecording(force = false): void {
    const values = this._client.getContext().values;

    if (!force && values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    if (this._replayer.isRecording()) {
      return;
    }

    this._wasStopped = false;
    StatsigMetadataProvider.add({ isRecordingSession: 'true' });
    this._replayer.record(
      (e, d, isCheckOut) => this._onRecordingEvent(e, d, isCheckOut),
      this._options?.rrwebConfig ?? {},
    );
  }

  protected _shutdown(): void {
    this._replayer.stop();
    StatsigMetadataProvider.add({ isRecordingSession: 'false' });

    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }
    this._logRecording();
  }
}
