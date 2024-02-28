import {
  StatsigDataProvider,
  StatsigUser,
  Storage,
  getUserStorageKey,
  setObjectInStorage,
} from '@statsig/client-core';

const LAST_MODIFIED_STORAGE_KEY = 'statsig.cache.last_modified_time';
const CACHE_LIMIT = 10;

export class LocalStorageCacheEvaluationsDataProvider
  implements StatsigDataProvider
{
  readonly isTerminal = false;
  readonly source = 'Cache';

  private _lastModifiedTimeMap: Record<string, number> = {};

  async getData(sdkKey: string, user?: StatsigUser): Promise<string | null> {
    const cacheKey = getUserStorageKey(sdkKey, user);
    const result = await Storage.getItem(cacheKey);
    return Promise.resolve(result);
  }

  async setData(
    sdkKey: string,
    data: string,
    user?: StatsigUser,
  ): Promise<void> {
    const cacheKey = getUserStorageKey(sdkKey, user);
    await Storage.setItem(cacheKey, data);
    await this._runCacheEviction(cacheKey);
    return Promise.resolve();
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
