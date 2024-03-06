import { StatsigDataProvider, getUserStorageKey } from '@statsig/client-core';

export class BootstrapSpecsDataProvider implements StatsigDataProvider {
  readonly source = 'Bootstrap';

  private _data: Record<string, string> = {};

  getData(sdkKey: string): string | null {
    const cacheKey = getUserStorageKey(sdkKey);
    const result = this._data[cacheKey] ?? null;
    return result;
  }

  addData(sdkKey: string, data: string): void {
    const cacheKey = getUserStorageKey(sdkKey);
    this._data[cacheKey] = data;
  }
}
