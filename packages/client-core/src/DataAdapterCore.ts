import { ErrorBoundary } from './ErrorBoundary';
import { Log } from './Log';
import {
  DataAdapterAsyncOptions,
  DataAdapterCachePrefix,
  DataAdapterResult,
} from './StatsigDataAdapter';
import { AnyStatsigOptions } from './StatsigOptionsCommon';
import { StatsigUser, getUserStorageKey } from './StatsigUser';
import {
  Storage,
  _getObjectFromStorage,
  _setObjectInStorage,
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

  attach(sdkKey: string, _options: AnyStatsigOptions | null): void {
    this._sdkKey = sdkKey;
    this._errorBoundary = new ErrorBoundary(sdkKey);
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

  protected async _getDataAsyncImpl(
    current: DataAdapterResult | null,
    user?: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<DataAdapterResult | null> {
    const cache = current ?? this.getDataSync(user);

    const ops = [
      this._fetchAndPrepFromNetwork(cache?.data ?? null, user, options),
    ];

    if (options?.timeoutMs) {
      ops.push(
        new Promise((r) => setTimeout(r, options.timeoutMs)).then(() => {
          Log.debug('Fetching latest value timed out');
          return null;
        }),
      );
    }

    return await Promise.race(ops);
  }

  protected async _prefetchDataImpl(
    user?: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<void> {
    const cacheKey = this._getCacheKey(user);
    const result = await this._getDataAsyncImpl(null, user, options);
    if (result) {
      this._addToInMemoryCache(cacheKey, { ...result, source: 'Prefetch' });
    }
  }

  protected abstract _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<string | null>;

  private async _fetchAndPrepFromNetwork(
    current: string | null,
    user: StatsigUser | undefined,
    options: DataAdapterAsyncOptions | undefined,
  ): Promise<DataAdapterResult | null> {
    const latest = await this._fetchFromNetwork(current, user, options);

    if (!latest) {
      Log.debug('No response returned for latest value');
      return null;
    }

    const response = typedJsonParse<{ has_updates: boolean }>(
      latest,
      'has_updates',
      'Failure while attempting to persist latest value',
    );

    let result: DataAdapterResult | null = null;
    if (response?.has_updates === true) {
      result = { source: 'Network', data: latest, receivedAt: Date.now() };
    } else if (current && response?.has_updates === false) {
      result = {
        source: 'NetworkNotModified',
        data: current,
        receivedAt: Date.now(),
      };
    }

    if (!result) {
      return null;
    }

    const cacheKey = this._getCacheKey(user);
    this._addToInMemoryCache(cacheKey, result);
    await this._writeToCache(cacheKey, result);

    return result;
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
    const cache = Storage._getItemSync?.(cacheKey);
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
    await Storage._setItem(cacheKey, JSON.stringify(result));
    await this._runLocalStorageCacheEviction(cacheKey);
  }

  private async _runLocalStorageCacheEviction(cacheKey: string): Promise<void> {
    const lastModifiedTimeMap =
      (await _getObjectFromStorage<Record<string, number>>(
        this._lastModifiedStoreKey,
      )) ?? {};
    lastModifiedTimeMap[cacheKey] = Date.now();

    const entries = Object.entries(lastModifiedTimeMap);
    if (entries.length <= CACHE_LIMIT) {
      await _setObjectInStorage(
        this._lastModifiedStoreKey,
        lastModifiedTimeMap,
      );
      return;
    }

    const oldest = entries.reduce((acc, current) => {
      return current[1] < acc[1] ? current : acc;
    });

    delete lastModifiedTimeMap[oldest[0]];
    await Storage._removeItem(oldest[0]);
    await _setObjectInStorage(this._lastModifiedStoreKey, lastModifiedTimeMap);
  }
}
