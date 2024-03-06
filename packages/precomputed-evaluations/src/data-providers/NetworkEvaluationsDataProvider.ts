import { StatsigDataProvider, StatsigUser } from '@statsig/client-core';

import { EvaluationResponse } from '../EvaluationData';
import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

class NetworkEvaluationsDataProviderImpl implements StatsigDataProvider {
  readonly source = 'Network';

  constructor(private _network: StatsigNetwork) {}

  protected readonly fetchLatestValues = (
    sdkKey: string,
    currentData: string | null,
    user?: StatsigUser,
  ) => {
    let data: EvaluationResponse | null = null;
    try {
      data = currentData
        ? (JSON.parse(currentData) as EvaluationResponse)
        : null;
    } catch {
      // noop
    }

    return this._network.fetchEvaluations(sdkKey, data, user);
  };
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
    return await this.fetchLatestValues(sdkKey, null, user);
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
    currentData: string | null,
    user?: StatsigUser,
  ): Promise<string | null> {
    return await this.fetchLatestValues(sdkKey, currentData, user);
  }
}
