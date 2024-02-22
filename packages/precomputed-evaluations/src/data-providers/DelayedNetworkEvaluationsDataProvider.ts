import { StatsigDataProvider, StatsigUser } from '@sigstat/core';

import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

export class DelayedNetworkEvaluationsDataProvider
  implements StatsigDataProvider
{
  readonly isTerminal = false;
  readonly source = 'Network';

  static create(
    options: StatsigOptions | null = null,
  ): DelayedNetworkEvaluationsDataProvider {
    return new DelayedNetworkEvaluationsDataProvider(
      new StatsigNetwork(options?.api),
    );
  }

  constructor(private _network: StatsigNetwork) {}

  async getDataPostInit(
    sdkKey: string,
    user?: StatsigUser,
  ): Promise<string | null> {
    const response = await this._network.fetchEvaluations(sdkKey, user);
    return response;
  }
}
