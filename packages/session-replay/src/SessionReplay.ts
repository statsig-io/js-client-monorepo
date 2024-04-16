import {
  Log,
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
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
  private _sessionID = '';

  constructor(private _client: PrecomputedEvaluationsInterface) {
    const { sdkKey } = _client.getContext();
    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.srInstances ?? {};
    instances[sdkKey] = this;
    __STATSIG__.srInstances = instances;

    this._replayer = new SessionReplayClient();
    this._client.on('pre_shutdown', () => this._shutdown());
    this._client.on('values_updated', () => this._attemptToStartRecording());
    this._client.on('session_expired', () => {
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

  private _onRecordingEvent(event: ReplayEvent, data: ReplaySessionData) {
    this._sessionData = data;
    this._events.push(event);

    const payload = JSON.stringify(this._events);
    if (payload.length > MAX_REPLAY_PAYLOAD_BYTES) {
      this._flush(payload, data);
    }
  }

  private _attemptToStartRecording() {
    const values = this._client.getContext().values;

    if (values?.can_record_session !== true) {
      this._shutdown();
      return;
    }

    const sampling = values.session_recording_rate ?? 0;
    if (Math.random() >= sampling) {
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
    const payload = JSON.stringify(this._events);
    this._flush(payload, this._sessionData);
  }

  private _flushWithSessionID(sessionID: string) {
    if (this._events.length === 0 || this._sessionData == null) {
      return;
    }
    const data = this._sessionData;
    const payload = JSON.stringify(this._events);
    this._logRecordingEvent(payload, data, sessionID);
  }

  private _logRecordingEvent(
    payload: string,
    data: ReplaySessionData,
    sessionID: string,
  ) {
    const { sdkVersion } = StatsigMetadataProvider.get();
    this._client.logEvent({
      eventName: 'statsig::session_recording',
      value: sessionID,
      metadata: {
        session_start_ts: String(data.startTime),
        session_end_ts: String(data.endTime),
        clicks_captured_cumulative: String(data.clickCount),
        rrweb_events: payload,
        session_replay_sdk_version: sdkVersion,
      },
    });
    this._events = [];
  }

  private _flush(payload: string, data: ReplaySessionData) {
    this._client
      .getAsyncContext()
      .then((context) => {
        this._logRecordingEvent(payload, data, context.sessionID);
      })
      .catch((err) => {
        Log.error(err);
      });
  }
}
