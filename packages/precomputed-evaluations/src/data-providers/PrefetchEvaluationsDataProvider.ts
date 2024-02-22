import {
  StatsigDataProvider,
  StatsigUser,
  getUserStorageKey,
} from '@sigstat/core';

import StatsigNetwork from '../Network';

export class PrefetchEvaluationDataProvider implements StatsigDataProvider {
  readonly isTerminal = true;
  readonly source = 'Prefetch';

  private _network: StatsigNetwork;
  private _data: Record<string, string> = {};

  constructor(api?: string) {
    this._network = new StatsigNetwork(api);
  }

  getData(sdkKey: string, user?: StatsigUser): Promise<string | null> {
    const key = getUserStorageKey(sdkKey, user);
    return Promise.resolve(this._data[key]);
  }

  async prefetchEvaluationsForUser(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<void> {
    const response = await this._network.fetchEvaluations(sdkKey, user);
    if (response) {
      const key = getUserStorageKey(sdkKey, user);
      this._data[key] = response;
    }
  }
}
