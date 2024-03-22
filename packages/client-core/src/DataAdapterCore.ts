import { ErrorBoundary } from './ErrorBoundary';
import { Log } from './Log';
import { monitorClass } from './Monitoring';
import {
  DataAdapterCachePrefix,
  DataAdapterResult,
} from './StatsigDataAdapter';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { StatsigUser, getUserStorageKey } from './StatsigUser';
import {
  Storage,
  getObjectFromStorage,
  setObjectInStorage,
} from './StorageProvider';
import { typedJsonParse } from './TypedJsonParse';

const CACHE_LIMIT = 10;

export abstract class DataAdapterCore {
  protected _errorBoundary: ErrorBoundary | null = null;

  private _sdkKey: string | null = null;
  private _inMemoryCache: Record<string, DataAdapterResult> = {};
  private _lastModifiedStoreKey: string;

  protected constructor(
    private _adapterName: string,
    private _cacheSuffix: string,
  ) {
    this._lastModifiedStoreKey = `statsig.last_modified_time.${_cacheSuffix}`;
  }

  attach(sdkKey: string, _options: StatsigOptionsCommon | null): void {
    this._sdkKey = sdkKey;
    this._errorBoundary = new ErrorBoundary(sdkKey);
    monitorClass(this._errorBoundary, this);
  }

  getDataSync(user?: StatsigUser | undefined): DataAdapterResult | null {
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
    current: DataAdapterResult | null,
    user?: StatsigUser,
  ): Promise<DataAdapterResult | null> {
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

  async prefetchData(user?: StatsigUser | undefined): Promise<void> {
    const cacheKey = this._getCacheKey(user);
    const result = await this.getDataAsync(null, user);
    if (result) {
      this._addToInMemoryCache(cacheKey, { ...result, source: 'Prefetch' });
    }
  }

  setData(data: string, user?: StatsigUser): void {
    const cacheKey = this._getCacheKey(user);
    this._addToInMemoryCache(cacheKey, {
      source: 'Bootstrap',
      data,
      receivedAt: Date.now(),
    });
  }

  /**
   * (Internal Use Only) - Used by \@statsig/react-native-bindings to prime the cache from AsyncStorage
   *
   * @param {Record<string, DataAdapterResult>} cache The values to merge into _inMemoryCache
   */
  __primeInMemoryCache(cache: Record<string, DataAdapterResult>): void {
    this._inMemoryCache = { ...this._inMemoryCache, ...cache };
  }

  protected abstract _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
  ): Promise<string | null>;

  private async _fetchLatest(
    current: string | null,
    user?: StatsigUser,
  ): Promise<DataAdapterResult | null> {
    const latest = await this._fetchFromNetwork(current, user);
    if (!latest) {
      Log.debug('No response returned for latest value');
      return null;
    }

    const response = typedJsonParse<{ has_updates: boolean }>(
      latest,
      'has_updates',
      'Failure while attempting to persist latest value',
    );

    if (current && response?.has_updates === false) {
      return {
        source: 'NetworkNotModified',
        data: current,
        receivedAt: Date.now(),
      };
    }

    if (response?.has_updates !== true) {
      return null;
    }

    return { source: 'Network', data: latest, receivedAt: Date.now() };
  }

  protected _getSdkKey(): string {
    if (this._sdkKey != null) {
      return this._sdkKey;
    }

    Log.error(`${this._adapterName} is not attached to a Client`);
    return '';
  }

  protected _getCacheKey(user?: StatsigUser): string {
    const key = getUserStorageKey(this._getSdkKey(), user);
    return `${DataAdapterCachePrefix}.${this._cacheSuffix}.${key}`;
  }

  protected _addToInMemoryCache(
    cacheKey: string,
    result: DataAdapterResult,
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

  private _loadFromCache(cacheKey: string): DataAdapterResult | null {
    const cache = Storage.getItemSync?.(cacheKey);
    if (cache == null) {
      return null;
    }

    const result = typedJsonParse<DataAdapterResult>(
      cache,
      'source',
      'Failed to parse cached result',
    );

    return result ? { ...result, source: 'Cache' } : null;
  }

  private async _writeToCache(
    cacheKey: string,
    result: DataAdapterResult,
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
