import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
  StatsigPlugin,
  _isServerEnv,
} from '@statsig/client-core';

import { EndReason, SessionReplayBase } from './SessionReplayBase';
import { RRWebConfig } from './SessionReplayClient';
import {
  MAX_LOGS,
  getNewOptionsWithPrivacySettings,
} from './SessionReplayUtils';

type SessionReplayOptions = {
  rrwebConfig?: RRWebConfig;
  forceRecording?: boolean;
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
  // Early exit for server-side rendering - plugins should only run in browser
  if (_isServerEnv()) {
    return;
  }
  new SessionReplay(client, options);
}

export class SessionReplay extends SessionReplayBase {
  constructor(
    client: PrecomputedEvaluationsInterface,
    options?: SessionReplayOptions,
  ) {
    let newOptions = options;
    const privacySettings =
      client.getContext().values?.session_recording_privacy_settings;
    if (privacySettings) {
      newOptions = getNewOptionsWithPrivacySettings(
        newOptions ?? {},
        privacySettings,
      );
    }

    super(client, newOptions);
    this._client.$on('values_updated', () => {
      if (!this._wasStopped) {
        this._attemptToStartRecording(this._options?.forceRecording);
      }
    });

    this._attemptToStartRecording(this._options?.forceRecording);
  }

  protected override _shutdown(endReason?: EndReason): void {
    super._shutdownImpl(endReason);
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

    if (this._replayer.isRecording()) {
      return;
    }

    this._wasStopped = false;
    StatsigMetadataProvider.add({ isRecordingSession: 'true' });
    this._replayer.record(
      (e, d) => this._onRecordingEvent(e, d),
      this._options?.rrwebConfig ?? {},
      () => {
        this._shutdown();
      },
    );
  }
}
