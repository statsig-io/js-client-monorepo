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

export class SessionReplay {
  private _replayer: SessionReplayClient;
  private _sessionData: ReplaySessionData | null = null;
  private _events: ReplayEvent[] = [];

  constructor(private _client: PrecomputedEvaluationsInterface) {
    this._replayer = new SessionReplayClient();
    this._client.on('pre_shutdown', () => this._shutdown());
    this._client.on('values_updated', () => this._attemptToStartRecording());

    this._attemptToStartRecording();
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

  private _flush(payload: string, data: ReplaySessionData) {
    // prevent blowing up the log queue
    this._client.flush().catch((err) => {
      Log.error(err);
    });

    const { sdkVersion } = StatsigMetadataProvider.get();

    this._client.logEvent({
      eventName: 'statsig::session_recording',
      value: this._client.getContext().sessionID,
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
}
