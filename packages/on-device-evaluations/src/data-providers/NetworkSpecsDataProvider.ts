import { StatsigDataProvider } from '@statsig/client-core';

import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

class NetworkSpecsDataProviderImpl implements StatsigDataProvider {
  readonly source = 'Network';

  constructor(private _network: StatsigNetwork) {}

  protected readonly fetchLatestValues = (sdkKey: string) =>
    this._network.fetchConfigSpecs(sdkKey);
}

export class NetworkSpecsDataProvider extends NetworkSpecsDataProviderImpl {
  static create(
    options: StatsigOptions | null = null,
  ): NetworkSpecsDataProvider {
    return new NetworkSpecsDataProvider(new StatsigNetwork(options));
  }

  async getDataAsync(sdkKey: string): Promise<string | null> {
    return await this.fetchLatestValues(sdkKey);
  }
}

export class DelayedNetworkSpecsDataProvider extends NetworkSpecsDataProviderImpl {
  static create(
    options: StatsigOptions | null = null,
  ): DelayedNetworkSpecsDataProvider {
    return new DelayedNetworkSpecsDataProvider(new StatsigNetwork(options));
  }

  async getDataPostInit(sdkKey: string): Promise<string | null> {
    return await this.fetchLatestValues(sdkKey);
  }
}
