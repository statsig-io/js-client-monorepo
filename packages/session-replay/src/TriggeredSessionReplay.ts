import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
  StatsigPlugin,
  _DJB2,
  _isCurrentlyVisible,
} from '@statsig/client-core';

import { EndReason, SessionReplayBase } from './SessionReplayBase';
import {
  RRWebConfig,
  ReplayEvent,
  ReplaySessionData,
} from './SessionReplayClient';
import { MAX_LOGS } from './SessionReplayUtils';

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
    runStatsigTriggeredSessionReplay(client, this.options);
  }
}

export function runStatsigTriggeredSessionReplay(
  client: PrecomputedEvaluationsInterface,
  options?: SessionReplayOptions,
): void {
  new TriggeredSessionReplay(client, options);
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
    this._subscribeToClientEvents(options);
    if (options?.autoStartRecording) {
      this._attemptToStartRecording(this._options?.forceRecording);
    } else if (options?.keepRollingWindow) {
      this._attemptToStartRollingWindow();
    }
  }

  private _subscribeToClientEvents(
    options?: TriggeredSessionReplayOptions,
  ): void {
    this._subscribeToValuesUpdated(options);
    this._subscribeToLogEventCalled();
    this._subscribeToGateEvaluation();
    this._subscribeToExperimentEvaluation();
  }

  private _subscribeToValuesUpdated(
    options?: TriggeredSessionReplayOptions,
  ): void {
    this._client.$on('values_updated', () => {
      if (!this._wasStopped) {
        if (options?.autoStartRecording) {
          this._attemptToStartRecording(this._options?.forceRecording);
        } else if (options?.keepRollingWindow) {
          this._attemptToStartRollingWindow();
        }
      }
    });
  }

  private _subscribeToLogEventCalled(): void {
    this._client.$on('log_event_called', (event) => {
      if (this._wasStopped) {
        return;
      }
      const values = this._client.getContext().values;
      const passedTargeting = values?.passes_session_recording_targeting;
      if (
        passedTargeting === false ||
        values?.session_recording_event_triggers == null
      ) {
        return;
      }
      const trigger =
        values.session_recording_event_triggers[event.event.eventName];
      if (trigger == null) {
        return;
      }

      if (trigger.passes_sampling === false) {
        return;
      }

      const targetValues = trigger.values;
      if (targetValues == null) {
        this._attemptToStartRecording(true);
        return;
      }
      if (targetValues.includes(String(event.event.value ?? ''))) {
        this._attemptToStartRecording(true);
        return;
      }
    });
  }

  private _subscribeToGateEvaluation(): void {
    this._client.$on('gate_evaluation', (event) => {
      this._tryStartExposureRecording(
        event.gate.name,
        String(event.gate.value),
        'gate',
      );
    });
  }

  private _subscribeToExperimentEvaluation(): void {
    this._client.$on('experiment_evaluation', (event) => {
      this._tryStartExposureRecording(
        event.experiment.name,
        event.experiment.groupName ?? '',
        'experiment',
      );
    });
  }

  private _tryStartExposureRecording(
    name: string,
    value: string,
    type: 'gate' | 'experiment',
  ): void {
    if (this._wasStopped) {
      return;
    }
    const values = this._client.getContext().values;
    const passedTargeting = values?.passes_session_recording_targeting;
    if (
      passedTargeting === false ||
      values?.session_recording_exposure_triggers == null
    ) {
      return;
    }

    if (
      (type === 'gate' && values.record_on_gate_check === true) ||
      (type === 'experiment' && values.record_on_experiment_check === true)
    ) {
      this._attemptToStartRecording(true);
      return;
    }

    const trigger =
      values.session_recording_exposure_triggers[name] ??
      values.session_recording_exposure_triggers[_DJB2(name)];
    if (trigger == null) {
      return;
    }

    if (trigger.passes_sampling === false) {
      return;
    }
    const targetValues = trigger.values;
    if (targetValues == null) {
      this._attemptToStartRecording(true);
      return;
    }
    if (targetValues.includes(value)) {
      this._attemptToStartRecording(true);
      return;
    }
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
      this._sessionData.startTime =
        this._sessionData.startTime === -1
          ? currentEvents[i].data.startTime
          : Math.min(
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
    // stop recording and since it will be started again
    this._replayer.stop();
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

    if (values?.passes_session_recording_targeting === false) {
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
    if (this._totalLogs >= MAX_LOGS) {
      return;
    }
    const values = this._client.getContext().values;

    if (values?.recording_blocked === true) {
      this._shutdown();
      return;
    }

    if (!force && values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    if (values?.passes_session_recording_targeting === false) {
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
