import {
  StatsigDataProvider,
  StatsigUser,
  getUserStorageKey,
} from '@statsig/client-core';

export class BootstrapEvaluationsDataProvider implements StatsigDataProvider {
  readonly source = 'Bootstrap';

  private _data: Record<string, string> = {};

  getData(sdkKey: string, user?: StatsigUser): string | null {
    const cacheKey = getUserStorageKey(sdkKey, user);
    const result = this._data[cacheKey] ?? null;
    return result;
  }

  addDataForUser(sdkKey: string, data: string, user: StatsigUser): void {
    const cacheKey = getUserStorageKey(sdkKey, user);
    this._data[cacheKey] = data;
  }
}
