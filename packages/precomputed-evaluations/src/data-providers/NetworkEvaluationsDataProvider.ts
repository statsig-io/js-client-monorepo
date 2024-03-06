import { StatsigDataProvider, StatsigUser } from '@statsig/client-core';

import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

class NetworkEvaluationsDataProviderImpl implements StatsigDataProvider {
  readonly source = 'Network';

  constructor(private _network: StatsigNetwork) {}

  protected readonly fetchLatestValues = (sdkKey: string, user?: StatsigUser) =>
    this._network.fetchEvaluations(sdkKey, user);
}

export class NetworkEvaluationsDataProvider extends NetworkEvaluationsDataProviderImpl {
  static create(
    options: StatsigOptions | null = null,
  ): NetworkEvaluationsDataProvider {
    return new NetworkEvaluationsDataProvider(new StatsigNetwork(options));
  }

  async getDataAsync(
    sdkKey: string,
    user?: StatsigUser,
  ): Promise<string | null> {
    return await this.fetchLatestValues(sdkKey, user);
  }
}

export class DelayedNetworkEvaluationsDataProvider extends NetworkEvaluationsDataProviderImpl {
  static create(
    options: StatsigOptions | null = null,
  ): DelayedNetworkEvaluationsDataProvider {
    return new DelayedNetworkEvaluationsDataProvider(
      new StatsigNetwork(options),
    );
  }

  async getDataPostInit(
    sdkKey: string,
    user?: StatsigUser,
  ): Promise<string | null> {
    return await this.fetchLatestValues(sdkKey, user);
  }
}
