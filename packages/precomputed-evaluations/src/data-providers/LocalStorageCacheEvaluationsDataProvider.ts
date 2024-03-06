import {
  StatsigDataProvider,
  StatsigUser,
  Storage,
  getObjectFromStorage,
  getUserStorageKey,
  setObjectInStorage,
} from '@statsig/client-core';

const LAST_MODIFIED_STORAGE_KEY = 'statsig.last_modified_time';
const CACHE_LIMIT = 10;

export class LocalStorageCacheEvaluationsDataProvider
  implements StatsigDataProvider
{
  readonly source = 'Cache';

  getData(sdkKey: string, user?: StatsigUser): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const cacheKey = getUserStorageKey(sdkKey, user);
    const result = window.localStorage.getItem(cacheKey);
    return result;
  }

  async getDataAsync(
    sdkKey: string,
    user?: StatsigUser,
  ): Promise<string | null> {
    const cacheKey = getUserStorageKey(sdkKey, user);
    const result = await Storage.getItem(cacheKey);
    return result;
  }

  async setDataPostInit(
    sdkKey: string,
    data: string,
    user?: StatsigUser,
  ): Promise<void> {
    const cacheKey = getUserStorageKey(sdkKey, user);
    await Storage.setItem(cacheKey, data);
    await this._runCacheEviction(cacheKey);
  }

  private async _runCacheEviction(cacheKey: string): Promise<void> {
    const lastModifiedTimeMap =
      (await getObjectFromStorage<Record<string, number>>(
        LAST_MODIFIED_STORAGE_KEY,
      )) ?? {};
    lastModifiedTimeMap[cacheKey] = Date.now();

    const entries = Object.entries(lastModifiedTimeMap);
    if (entries.length < CACHE_LIMIT) {
      await setObjectInStorage(LAST_MODIFIED_STORAGE_KEY, lastModifiedTimeMap);
      return;
    }

    const oldest = entries.reduce((acc, current) => {
      return current[1] < acc[1] ? current : acc;
    });

    await Storage.removeItem(oldest[0]);
    delete lastModifiedTimeMap[oldest[0]];
    await setObjectInStorage(LAST_MODIFIED_STORAGE_KEY, lastModifiedTimeMap);
  }
}
