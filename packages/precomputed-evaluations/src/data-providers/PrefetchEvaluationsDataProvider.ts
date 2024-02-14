import {
  EvaluationDataProvider,
  StatsigUser,
  getUserStorageKey,
} from '@sigstat/core';

import StatsigNetwork from '../Network';

export class PrefetchEvaluationDataProvider implements EvaluationDataProvider {
  readonly isTerminal = true;
  readonly source = 'Prefetch';

  private _network: StatsigNetwork;
  private _data: Record<string, string> = {};

  constructor(api?: string) {
    this._network = new StatsigNetwork(api);
  }

  getEvaluationsData(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<string | null> {
    const key = getUserStorageKey(user, sdkKey);
    return Promise.resolve(this._data[key]);
  }

  async prefetchEvaluationsForUser(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<void> {
    const response = await this._network.fetchEvaluations(sdkKey, user);
    if (response) {
      const key = getUserStorageKey(user, sdkKey);
      this._data[key] = response;
    }
  }
}
