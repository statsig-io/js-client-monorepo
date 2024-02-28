import { StatsigDataProvider } from '@statsig/client-core';

import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

export class NetworkSpecsDataProvider implements StatsigDataProvider {
  readonly isTerminal = false;
  readonly source = 'Network';

  static create(
    options: StatsigOptions | null = null,
  ): NetworkSpecsDataProvider {
    return new NetworkSpecsDataProvider(new StatsigNetwork(options));
  }

  constructor(private _network: StatsigNetwork) {}

  async getData(sdkKey: string): Promise<string | null> {
    const response = await this._network.fetchConfigSpecs(sdkKey);
    return response;
  }
}
