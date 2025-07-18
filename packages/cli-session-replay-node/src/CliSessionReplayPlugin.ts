import {
  PrecomputedEvaluationsInterface,
  StatsigPlugin,
} from '@statsig/client-core';

import { CliRecording, CliRecordingOptions } from './CliRecording';
import { CliRecordingNodeAdapterFactory } from './CliRecordingNodeAdapter';

export class StatsigCliSessionReplayPlugin
  implements StatsigPlugin<PrecomputedEvaluationsInterface>
{
  readonly __plugin = 'cli-session-replay-node';

  constructor(private readonly options?: CliRecordingOptions) {}

  bind(client: PrecomputedEvaluationsInterface): void {
    CliRecording.record(client, CliRecordingNodeAdapterFactory, this.options);
  }
}
