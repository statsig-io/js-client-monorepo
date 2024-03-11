import { ErrorBoundary } from './ErrorBoundary';
import { Log } from './Log';
import { monitorClass } from './Monitoring';
import {
  DataAdapterCachePrefix,
  StatsigDataAdapter,
  StatsigDataAdapterResult,
} from './StatsigDataAdapter';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { StatsigUser, getUserStorageKey } from './StatsigUser';
import {
  Storage,
  getObjectFromStorage,
  setObjectInStorage,
} from './StorageProvider';

const CACHE_LIMIT = 10;

type UpdatesAwareObject = {
  has_updates?: boolean;
};

export abstract class DataAdapterCore<T extends UpdatesAwareObject>
  implements StatsigDataAdapter
{
  protected _errorBoundary: ErrorBoundary | null = null;

  private _sdkKey: string | null = null;
  private _inMemoryCache: Record<string, StatsigDataAdapterResult> = {};
  private _lastModifiedStoreKey: string;

  protected constructor(
    private _className: string,
    private _cacheSuffix: string,
  ) {
    this._lastModifiedStoreKey = `statsig.last_modified_time.${_cacheSuffix}`;
  }

  attach(sdkKey: string, _options: StatsigOptionsCommon | null): void {
    this._sdkKey = sdkKey;
    this._errorBoundary = new ErrorBoundary(sdkKey);
    monitorClass(this._errorBoundary, this);
  }

  getDataSync(user?: StatsigUser | undefined): StatsigDataAdapterResult | null {
    const cacheKey = this._getCacheKey(user);
    const result = this._inMemoryCache[cacheKey];
    if (result) {
      return result;
    }

    const cache = this._loadFromCache(cacheKey);
    if (cache) {
      this._addToInMemoryCache(cacheKey, cache);
      return this._inMemoryCache[cacheKey];
    }

    return null;
  }

  async getDataAsync(
    current: StatsigDataAdapterResult | null,
    user?: StatsigUser,
  ): Promise<StatsigDataAdapterResult | null> {
    const cache = current ?? this.getDataSync(user);
    const latest = await this._fetchLatest(cache?.data ?? null, user);

    const cacheKey = this._getCacheKey(user);
    if (latest) {
      this._addToInMemoryCache(cacheKey, latest);
    }

    if (
      latest?.source === 'Network' ||
      latest?.source === 'NetworkNotModified'
    ) {
      await this._writeToCache(cacheKey, latest);
    }

    return latest;
  }

  /**
   * (Internal Use Only) - Used by @statsig/react-native-bindings to prime the cache from AsyncStorage
   * @param {Record<string, StatsigDataAdapterResult>} cache The values to set for _inMemoryCache
   */
  _setInMemoryCache(cache: Record<string, StatsigDataAdapterResult>): void {
    this._inMemoryCache = cache;
  }

  protected abstract _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
  ): Promise<string | null>;

  private async _fetchLatest(
    current: string | null,
    user?: StatsigUser,
  ): Promise<StatsigDataAdapterResult | null> {
    const latest = await this._fetchFromNetwork(current, user);

    if (!latest) {
      Log.debug('No response returned for latest value');
      return null;
    }

    try {
      const response = JSON.parse(latest) as T;

      if (current && response.has_updates === false) {
        return {
          source: 'NetworkNotModified',
          data: current,
          receivedAt: Date.now(),
        };
      }

      if (response.has_updates !== true) {
        return null;
      }

      return { source: 'Network', data: latest, receivedAt: Date.now() };
    } catch {
      Log.debug('Failure while attempting to persist latest value');
    }

    return null;
  }

  protected _getSdkKey(): string {
    if (this._sdkKey) {
      return this._sdkKey;
    }

    Log.error(`${this._className} is not attached to a Client`);
    return '';
  }

  protected _getCacheKey(user?: StatsigUser): string {
    const key = getUserStorageKey(this._getSdkKey(), user);
    return `${DataAdapterCachePrefix}.${this._cacheSuffix}.${key}`;
  }

  protected _addToInMemoryCache(
    cacheKey: string,
    result: StatsigDataAdapterResult,
  ): void {
    const entries = Object.entries(this._inMemoryCache);
    if (entries.length < CACHE_LIMIT) {
      this._inMemoryCache[cacheKey] = result;
      return;
    }

    const [oldest] = entries.reduce((acc, curr) => {
      return curr[1] < acc[1] ? curr : acc;
    });

    delete this._inMemoryCache[oldest];
    this._inMemoryCache[cacheKey] = result;
  }

  private _loadFromCache(cacheKey: string): StatsigDataAdapterResult | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const cache = window.localStorage.getItem(cacheKey);
    if (cache == null) {
      return null;
    }

    try {
      const result = JSON.parse(cache) as StatsigDataAdapterResult;
      return { ...result, source: 'Cache' };
    } catch (e) {
      Log.error('Failed to parse cached result');
      return null;
    }
  }

  private async _writeToCache(
    cacheKey: string,
    result: StatsigDataAdapterResult,
  ): Promise<void> {
    await Storage.setItem(cacheKey, JSON.stringify(result));
    await this._runLocalStorageCacheEviction(cacheKey);
  }

  private async _runLocalStorageCacheEviction(cacheKey: string): Promise<void> {
    const lastModifiedTimeMap =
      (await getObjectFromStorage<Record<string, number>>(
        this._lastModifiedStoreKey,
      )) ?? {};
    lastModifiedTimeMap[cacheKey] = Date.now();

    const entries = Object.entries(lastModifiedTimeMap);
    if (entries.length <= CACHE_LIMIT) {
      await setObjectInStorage(this._lastModifiedStoreKey, lastModifiedTimeMap);
      return;
    }

    const oldest = entries.reduce((acc, current) => {
      return current[1] < acc[1] ? current : acc;
    });

    delete lastModifiedTimeMap[oldest[0]];
    await Storage.removeItem(oldest[0]);
    await setObjectInStorage(this._lastModifiedStoreKey, lastModifiedTimeMap);
  }
}
