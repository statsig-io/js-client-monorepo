import {
  AnyStatsigOptions,
  DataAdapterAsyncOptions,
  DataAdapterCore,
  DataAdapterResult,
  EvaluationsDataAdapter,
  StatsigUser,
} from '@statsig/client-core';

import Network from './Network';

export class StatsigEvaluationsDataAdapter
  extends DataAdapterCore
  implements EvaluationsDataAdapter
{
  private _network: Network | null = null;

  constructor() {
    super('EvaluationsDataAdapter', 'evaluations');
  }

  override attach(sdkKey: string, options: AnyStatsigOptions | null): void {
    super.attach(sdkKey, options);
    this._network = new Network(options ?? {});
  }

  getDataAsync(
    current: DataAdapterResult | null,
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<DataAdapterResult | null> {
    return this._getDataAsyncImpl(current, user, options);
  }

  prefetchData(
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<void> {
    return this._prefetchDataImpl(user, options);
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
