import {
  Log,
  StatsigDataAdapter,
  StatsigDataAdapterResult,
  Storage,
  getObjectFromStorage,
  getUserStorageKey,
  setObjectInStorage,
} from '@statsig/client-core';

import Network from './Network';
import { DownloadConfigSpecsResponse } from './SpecStore';
import { StatsigOptions } from './StatsigOptions';

const LAST_MODIFIED_STORAGE_KEY = 'statsig.last_modified_time.on_device_eval';
const CACHE_LIMIT = 10;

export class SpecsDataAdapter implements StatsigDataAdapter {
  private _sdkKey: string | null = null;
  private _network: Network | null = null;
  private _inMemoryCache: Record<string, StatsigDataAdapterResult> = {};

  attach(sdkKey: string, options: StatsigOptions | null): void {
    this._sdkKey = sdkKey;
    this._network = new Network(options ?? {});
  }

  getData(): StatsigDataAdapterResult | null {
    const cacheKey = this._getCacheKey();
    const result = this._inMemoryCache[cacheKey];
    if (result) {
      return result;
    }

    const cache = this._loadFromCache(cacheKey);
    if (cache) {
      this._inMemoryCache[cacheKey] = { source: 'Cache', data: cache };
      return this._inMemoryCache[cacheKey];
    }

    return null;
  }

  async handlePostUpdate(
    result: StatsigDataAdapterResult | null,
  ): Promise<void> {
    if (result?.source === 'Network') {
      return;
    }

    return this._sync();
  }

  async fetchLatestData(): Promise<void> {
    return this._sync();
  }

  setData(data: string): void {
    const cacheKey = this._getCacheKey();
    this._inMemoryCache[cacheKey] = { source: 'Bootstrap', data };
  }

  private _getSdkKey(): string {
    if (this._sdkKey) {
      return this._sdkKey;
    }

    Log.error('SpecsDataAdapter is not attached to a Client');
    return '';
  }

  private _getCacheKey(): string {
    const key = getUserStorageKey(this._getSdkKey());
    return `statsig.user_cache.on_device_eval.${key}`;
  }

  private async _sync() {
    const latest = await this._network?.fetchConfigSpecs(this._getSdkKey());
    if (!latest) {
      return;
    }

    try {
      const cacheKey = this._getCacheKey();
      const response = JSON.parse(latest) as DownloadConfigSpecsResponse;

      if (response.has_updates === false) {
        this._setNetworkNotModified(cacheKey);
      }

      if (response.has_updates !== true) {
        return;
      }

      this._inMemoryCache[cacheKey] = { source: 'Network', data: latest };
      await this._writeToCache(cacheKey, latest);
    } catch {
      Log.debug('Failure while attempting to persist latest value');
    }
  }

  private _loadFromCache(cacheKey: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(cacheKey);
  }

  private async _writeToCache(cacheKey: string, value: string): Promise<void> {
    await Storage.setItem(cacheKey, value);
    await this._runCacheEviction(cacheKey);
  }

  private async _runCacheEviction(cacheKey: string): Promise<void> {
    const lastModifiedTimeMap =
      (await getObjectFromStorage<Record<string, number>>(
        LAST_MODIFIED_STORAGE_KEY,
      )) ?? {};
    lastModifiedTimeMap[cacheKey] = Date.now();

    const entries = Object.entries(lastModifiedTimeMap);
    if (entries.length <= CACHE_LIMIT) {
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

  private _setNetworkNotModified(key: string) {
    const current = this._inMemoryCache[key];
    if (!current) {
      return;
    }

    this._inMemoryCache[key] = {
      ...current,
      source: 'NetworkNotModified',
    };
  }
}
