import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
  StatsigPlugin,
  _getStatsigGlobal,
  _isCurrentlyVisible,
} from '@statsig/client-core';

import { EndReason, SessionReplayBase } from './SessionReplayBase';
import {
  RRWebConfig,
  ReplayEvent,
  ReplaySessionData,
} from './SessionReplayClient';

type SessionReplayOptions = {
  rrwebConfig?: RRWebConfig;
  forceRecording?: boolean;
};

export type TriggeredSessionReplayOptions = {
  autoStartRecording?: boolean;
  keepRollingWindow?: boolean;
} & SessionReplayOptions;

export class StatsigTriggeredSessionReplayPlugin
  implements StatsigPlugin<PrecomputedEvaluationsInterface>
{
  readonly __plugin = 'triggered-session-replay';

  constructor(private readonly options?: TriggeredSessionReplayOptions) {}

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
  private _runningEventData: {
    events: { event: ReplayEvent; data: ReplaySessionData }[];
  }[] = [];
  private _isActiveRecording = false;

  constructor(
    client: PrecomputedEvaluationsInterface,
    options?: TriggeredSessionReplayOptions,
  ) {
    super(client, options);
    this._client.$on('values_updated', () => {
      if (!this._wasStopped) {
        if (options?.autoStartRecording) {
          this._attemptToStartRecording(this._options?.forceRecording);
        } else if (options?.keepRollingWindow) {
          this._attemptToStartRollingWindow();
        }
      }
    });

    if (options?.autoStartRecording) {
      this._attemptToStartRecording(this._options?.forceRecording);
    } else if (options?.keepRollingWindow) {
      this._attemptToStartRollingWindow();
    }
  }

  public startRecording(): void {
    this._wasStopped = false;
    this._attemptToStartRecording(this._options?.forceRecording);
  }

  public override forceStartRecording(): void {
    super.forceStartRecording();
  }

  public override stopRecording(): void {
    this._isActiveRecording = false;
    this._runningEventData = [];
    super.stopRecording();
  }

  private _handleStartActiveRecording(): void {
    this._isActiveRecording = true;
    if (this._runningEventData.length === 0) {
      return;
    }
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
    if (_isCurrentlyVisible()) {
      this._bumpSessionIdleTimerAndLogRecording();
    } else {
      this._logRecording();
    }
  }

  protected override _shutdown(endReason?: EndReason): void {
    this._isActiveRecording = false;
    this._runningEventData = [];
    super._shutdownImpl(endReason);
  }

  protected override _onRecordingEvent(
    event: ReplayEvent,
    data: ReplaySessionData,
    isCheckOut?: boolean,
  ): void {
    if (!this._isActiveRecording) {
      // The session has expired so we should clear the current data
      if (this._currentSessionID !== this._getSessionIdFromClient()) {
        this._shutdown('session_expired');
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

    super._onRecordingEvent(event, data);
  }

  protected _attemptToStartRollingWindow(): void {
    const values = this._client.getContext().values;

    if (values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    if (this._replayer.isRecording()) {
      return;
    }

    this._replayer.record(
      (e, d, isCheckOut) => this._onRecordingEvent(e, d, isCheckOut),
      this._options?.rrwebConfig ?? {},
      () => {
        this._shutdown();
      },
      true,
    );
  }

  protected _attemptToStartRecording(force = false): void {
    const values = this._client.getContext().values;

    if (!force && values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    this._handleStartActiveRecording();
    this._wasStopped = false;
    StatsigMetadataProvider.add({ isRecordingSession: 'true' });

    if (this._replayer.isRecording()) {
      return;
    }

    this._replayer.record(
      (e, d, isCheckOut) => this._onRecordingEvent(e, d, isCheckOut),
      this._options?.rrwebConfig ?? {},
      () => {
        this._shutdown();
      },
    );
  }
}
