import { StatsigUser, getUserStorageKey } from '@sigstat/core';

import {
  EvaluationDataProviderInterface,
  EvaluationSource,
} from '../EvaluationDataProvider';
import StatsigNetwork from '../Network';

export class PrefetchEvaluationDataProvider
  implements EvaluationDataProviderInterface
{
  private _network: StatsigNetwork;
  private _data: Record<string, string> = {};

  constructor(api?: string) {
    this._network = new StatsigNetwork(api);
  }

  source(): EvaluationSource {
    return 'Prefetch';
  }

  isTerminal(): boolean {
    return true;
  }

  getEvaluationsData(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<string | null> {
    const key = getUserStorageKey(user, sdkKey);
    return Promise.resolve(this._data[key]);
  }

  async setEvaluationsData(
    _sdkKey: string,
    _user: StatsigUser,
    _data: string,
  ): Promise<void> {
    // noop
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
