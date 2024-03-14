import {
  DataAdapterCore,
  StatsigOptionsCommon,
  StatsigUser,
} from '@statsig/client-core';

import Network from './Network';

export class EvaluationsDataAdapter extends DataAdapterCore {
  private _network: Network | null = null;

  constructor() {
    super('EvaluationsDataAdapter', 'evaluations');
  }

  override attach(sdkKey: string, options: StatsigOptionsCommon | null): void {
    super.attach(sdkKey, options);
    this._network = new Network(options ?? {});
  }

  protected override async _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
  ): Promise<string | null> {
    const result = await this._network?.fetchEvaluations(
      this._getSdkKey(),
      current,
      user,
    );
    return result ?? null;
  }
}
