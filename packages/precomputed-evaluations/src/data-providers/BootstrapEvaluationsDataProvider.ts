import {
  StatsigDataProvider,
  StatsigUser,
  getUserStorageKey,
} from '@statsig/client-core';

export class BootstrapEvaluationsDataProvider implements StatsigDataProvider {
  readonly isTerminal = true;
  readonly source = 'Bootstrap';

  private _data: Record<string, string> = {};

  async getData(sdkKey: string, user?: StatsigUser): Promise<string | null> {
    const cacheKey = getUserStorageKey(sdkKey, user);
    const result = this._data[cacheKey] ?? null;
    return Promise.resolve(result);
  }

  addDataForUser(sdkKey: string, data: string, user: StatsigUser): void {
    const cacheKey = getUserStorageKey(sdkKey, user);
    this._data[cacheKey] = data;
  }
}
