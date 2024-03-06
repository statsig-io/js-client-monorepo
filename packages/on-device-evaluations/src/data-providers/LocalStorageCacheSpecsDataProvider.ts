import {
  StatsigDataProvider,
  Storage,
  getUserStorageKey,
  setObjectInStorage,
} from '@statsig/client-core';

const LAST_MODIFIED_STORAGE_KEY = 'statsig.cache.last_modified_time';
const CACHE_LIMIT = 10;

export class LocalStorageCacheSpecsDataProvider implements StatsigDataProvider {
  readonly source = 'Cache';

  private _lastModifiedTimeMap: Record<string, number> = {};

  getData(sdkKey: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const cacheKey = getUserStorageKey(sdkKey);
    const result = window.localStorage.getItem(cacheKey);
    return result;
  }

  async getDataAsync(sdkKey: string): Promise<string | null> {
    const cacheKey = getUserStorageKey(sdkKey);
    const result = await Storage.getItem(cacheKey);
    return result;
  }

  async setDataPostInit(sdkKey: string, data: string): Promise<void> {
    const cacheKey = getUserStorageKey(sdkKey);
    await Storage.setItem(cacheKey, data);
    await this._runCacheEviction(cacheKey);
  }

  private async _runCacheEviction(cacheKey: string): Promise<void> {
    this._lastModifiedTimeMap[cacheKey] = Date.now();

    const entries = Object.entries(this._lastModifiedTimeMap);
    if (entries.length < CACHE_LIMIT) {
      await setObjectInStorage(
        LAST_MODIFIED_STORAGE_KEY,
        this._lastModifiedTimeMap,
      );
      return;
    }

    const oldest = entries.reduce((acc, current) => {
      return current[1] < acc[1] ? current : acc;
    });

    await Storage.removeItem(oldest[0]);
    delete this._lastModifiedTimeMap[oldest[0]];
    await setObjectInStorage(
      LAST_MODIFIED_STORAGE_KEY,
      this._lastModifiedTimeMap,
    );
  }
}
