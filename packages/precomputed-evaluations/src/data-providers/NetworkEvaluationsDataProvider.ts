import { StatsigDataProvider, StatsigUser } from '@sigstat/core';

import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

export class NetworkEvaluationsDataProvider implements StatsigDataProvider {
  readonly isTerminal = false;
  readonly source = 'Network';

  static create(
    options: StatsigOptions | null = null,
  ): NetworkEvaluationsDataProvider {
    return new NetworkEvaluationsDataProvider(new StatsigNetwork(options));
  }

  constructor(private _network: StatsigNetwork) {}

  async getData(sdkKey: string, user?: StatsigUser): Promise<string | null> {
    const response = await this._network.fetchEvaluations(sdkKey, user);
    return response;
  }
}
