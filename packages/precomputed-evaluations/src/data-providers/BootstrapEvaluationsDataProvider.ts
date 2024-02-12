import { StatsigUser, getUserStorageKey } from '@sigstat/core';

import {
  EvaluationDataProviderInterface,
  EvaluationSource,
} from '../EvaluationDataProvider';

export class BootstrapEvaluationsDataProvider
  implements EvaluationDataProviderInterface
{
  private _data: Record<string, string> = {};

  async getEvaluationsData(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<string | null> {
    const cacheKey = getUserStorageKey(user, sdkKey);
    const result = this._data[cacheKey] ?? null;
    return Promise.resolve(result);
  }

  async setEvaluationsData(
    _sdkKey: string,
    _user: StatsigUser,
    _data: string,
  ): Promise<void> {
    // noop
  }

  isTerminal(): boolean {
    return true;
  }

  source(): EvaluationSource {
    return 'Bootstrap';
  }

  addDataForUser(sdkKey: string, user: StatsigUser, data: string): void {
    const cacheKey = getUserStorageKey(user, sdkKey);
    this._data[cacheKey] = data;
  }
}