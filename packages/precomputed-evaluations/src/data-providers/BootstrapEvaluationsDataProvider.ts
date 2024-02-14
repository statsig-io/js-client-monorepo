import {
  EvaluationDataProvider,
  StatsigUser,
  getUserStorageKey,
} from '@sigstat/core';

export class BootstrapEvaluationsDataProvider
  implements EvaluationDataProvider
{
  readonly isTerminal = true;
  readonly source = 'Bootstrap';

  private _data: Record<string, string> = {};

  async getEvaluationsData(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<string | null> {
    const cacheKey = getUserStorageKey(user, sdkKey);
    const result = this._data[cacheKey] ?? null;
    return Promise.resolve(result);
  }

  addDataForUser(sdkKey: string, user: StatsigUser, data: string): void {
    const cacheKey = getUserStorageKey(user, sdkKey);
    this._data[cacheKey] = data;
  }
}
