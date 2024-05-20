import { Log } from './Log';
import { StableID } from './StableID';
import {
  DataAdapterAsyncOptions,
  DataAdapterResult,
  DataSource,
} from './StatsigDataAdapter';
import { AnyStatsigOptions } from './StatsigOptionsCommon';
import { StatsigUser, _normalizeUser } from './StatsigUser';
import {
  Storage,
  _getObjectFromStorage,
  _setObjectInStorage,
} from './StorageProvider';
import { typedJsonParse } from './TypedJsonParse';

const CACHE_LIMIT = 10;

export abstract class DataAdapterCore {
  protected _options: AnyStatsigOptions | null = null;

  private _sdkKey: string | null = null;
  private _inMemoryCache: InMemoryCache;
  private _lastModifiedStoreKey: string;

  protected constructor(
    private _adapterName: string,
    protected _cacheSuffix: string,
  ) {
    this._lastModifiedStoreKey = `statsig.last_modified_time.${_cacheSuffix}`;
    this._inMemoryCache = new InMemoryCache();
  }

  attach(sdkKey: string, options: AnyStatsigOptions | null): void {
    this._sdkKey = sdkKey;
    this._options = options;
  }

  getDataSync(user?: StatsigUser | undefined): DataAdapterResult | null {
    const cacheKey = this._getCacheKey(user);
    const inMem = this._inMemoryCache.get(cacheKey, user);

    if (inMem) {
      return inMem;
    }

    const cache = this._loadFromCache(cacheKey);
    if (cache) {
      this._inMemoryCache.add(cacheKey, cache);
      return this._inMemoryCache.get(cacheKey, user);
    }

    return null;
  }

  setData(data: string, user?: StatsigUser): void {
    const normalized = user && _normalizeUser(user, this._options?.environment);
    const cacheKey = this._getCacheKey(normalized);

    this._inMemoryCache.add(
      cacheKey,
      _makeDataAdapterResult('Bootstrap', data, null),
    );
  }

  /**
   * (Internal Use Only) - Used by \@statsig/react-native-bindings to prime the cache from AsyncStorage
   *
   * @param {Record<string, DataAdapterResult>} cache The values to merge into _inMemoryCache
   */
  __primeInMemoryCache(cache: Record<string, DataAdapterResult>): void {
    this._inMemoryCache.merge(cache);
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
      this._inMemoryCache.add(cacheKey, { ...result, source: 'Prefetch' });
    }
  }

  protected abstract _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<string | null>;

  protected abstract _getCacheKey(user?: StatsigUser): string;

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

    const sdkKey = this._getSdkKey();
    const stableID = await StableID.get(sdkKey);

    let result: DataAdapterResult | null = null;
    if (response?.has_updates === true) {
      result = _makeDataAdapterResult('Network', latest, stableID);
    } else if (current && response?.has_updates === false) {
      result = _makeDataAdapterResult('NetworkNotModified', current, stableID);
    } else {
      return null;
    }

    const cacheKey = this._getCacheKey(user);
    this._inMemoryCache.add(cacheKey, result);
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

function _makeDataAdapterResult(
  source: DataSource,
  data: string,
  stableID: string | null,
): DataAdapterResult {
  return {
    source,
    data,
    receivedAt: Date.now(),
    stableID,
  };
}

class InMemoryCache {
  private _data: Record<string, DataAdapterResult> = {};

  get(
    cacheKey: string,
    user: StatsigUser | undefined,
  ): DataAdapterResult | null {
    const result = this._data[cacheKey];
    const cached = result?.stableID;
    const provided = user?.customIDs?.stableID;

    if (provided && cached && provided !== cached) {
      Log.warn("'StatsigUser.customIDs.stableID' mismatch");
      return null;
    }

    return result;
  }

  add(cacheKey: string, value: DataAdapterResult) {
    const entries = Object.entries(this._data);
    if (entries.length < CACHE_LIMIT) {
      this._data[cacheKey] = value;
      return;
    }

    const [oldest] = entries.reduce((acc, curr) => {
      return curr[1] < acc[1] ? curr : acc;
    });

    delete this._data[oldest];
    this._data[cacheKey] = value;
  }

  merge(values: Record<string, DataAdapterResult>) {
    this._data = { ...this._data, ...values };
  }
}
