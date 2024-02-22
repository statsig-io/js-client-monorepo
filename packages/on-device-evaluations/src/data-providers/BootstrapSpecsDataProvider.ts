import { StatsigDataProvider, getUserStorageKey } from '@sigstat/core';

export class BootstrapSpecsDataProvider implements StatsigDataProvider {
  readonly isTerminal = true;
  readonly source = 'Bootstrap';

  private _data: Record<string, string> = {};

  async getData(sdkKey: string): Promise<string | null> {
    const cacheKey = getUserStorageKey(sdkKey);
    const result = this._data[cacheKey] ?? null;
    return Promise.resolve(result);
  }

  addData(sdkKey: string, data: string): void {
    const cacheKey = getUserStorageKey(sdkKey);
    this._data[cacheKey] = data;
  }
}
