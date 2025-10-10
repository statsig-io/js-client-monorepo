import { Log } from './Log';
import { NetworkCore } from './NetworkCore';
import { StableID } from './StableID';
import {
  DataAdapterAsyncOptions,
  DataAdapterResult,
  DataSource,
} from './StatsigDataAdapter';
import { AnyStatsigOptions } from './StatsigOptionsCommon';
import {
  StatsigUser,
  StatsigUserInternal,
  _getFullUserHash,
  _normalizeUser,
} from './StatsigUser';
import {
  Storage,
  _getObjectFromStorage,
  _setObjectInStorage,
} from './StorageProvider';
import { _typedJsonParse } from './TypedJsonParse';

const CACHE_LIMIT = 10;
const MAX_CACHE_WRITE_ATTEMPTS = 8;

export abstract class DataAdapterCore {
  protected _options: AnyStatsigOptions | null = null;

  private _sdkKey: string | null = null;
  private _inMemoryCache: InMemoryCache;
  private _lastModifiedStoreKey: string;
  private _cacheLimit: number = CACHE_LIMIT;

  protected constructor(
    private _adapterName: string,
    protected _cacheSuffix: string,
  ) {
    this._lastModifiedStoreKey = `statsig.last_modified_time.${_cacheSuffix}`;
    this._inMemoryCache = new InMemoryCache();
  }

  attach(
    sdkKey: string,
    options: AnyStatsigOptions | null,
    _network: NetworkCore | null,
  ): void {
    this._sdkKey = sdkKey;
    this._options = options;
  }

  getDataSync(user?: StatsigUser | undefined): DataAdapterResult | null {
    const normalized = user && _normalizeUser(user, this._options);
    const cacheKey = this._getCacheKey(normalized);
    const inMem = this._inMemoryCache.get(cacheKey, normalized);

    if (inMem && this._getIsCacheValueValid(inMem)) {
      return inMem;
    }

    const cache = this._loadFromCache(cacheKey);
    if (cache && this._getIsCacheValueValid(cache)) {
      this._inMemoryCache.add(cacheKey, cache, this._cacheLimit);
      return this._inMemoryCache.get(cacheKey, normalized);
    }

    return null;
  }

  setData(data: string, user?: StatsigUser): void {
    const normalized = user && _normalizeUser(user, this._options);
    const cacheKey = this._getCacheKey(normalized);

    this._inMemoryCache.add(
      cacheKey,
      _makeDataAdapterResult('Bootstrap', data, null, normalized),
      this._cacheLimit,
    );
  }

  protected _getIsCacheValueValid(current: DataAdapterResult): boolean {
    return (
      current.stableID == null ||
      current.stableID === StableID.get(this._getSdkKey())
    );
  }

  protected async _getDataAsyncImpl(
    current: DataAdapterResult | null,
    user?: StatsigUserInternal,
    options?: DataAdapterAsyncOptions,
  ): Promise<DataAdapterResult | null> {
    if (!Storage.isReady()) {
      await Storage.isReadyResolver();
    }

    const cache = current ?? this.getDataSync(user);

    const ops = [this._fetchAndPrepFromNetwork(cache, user, options)];

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
    const normalized = user && _normalizeUser(user, this._options);
    const cacheKey = this._getCacheKey(normalized);
    const result = await this._getDataAsyncImpl(null, normalized, options);
    if (result) {
      this._inMemoryCache.add(
        cacheKey,
        { ...result, source: 'Prefetch' },
        this._cacheLimit,
      );
    }
  }

  protected abstract _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
    options?: DataAdapterAsyncOptions,
    isCacheValidFor204?: boolean,
  ): Promise<string | null>;

  protected abstract _getCacheKey(user?: StatsigUserInternal): string;

  protected abstract _isCachedResultValidFor204(
    result: DataAdapterResult,
    user: StatsigUser | undefined,
  ): boolean;

  private async _fetchAndPrepFromNetwork(
    cachedResult: DataAdapterResult | null,
    user: StatsigUserInternal | undefined,
    options: DataAdapterAsyncOptions | undefined,
  ): Promise<DataAdapterResult | null> {
    const cachedData: string | null = cachedResult?.data ?? null;
    const isCacheValidFor204 =
      cachedResult != null &&
      this._isCachedResultValidFor204(cachedResult, user);

    const latest = await this._fetchFromNetwork(
      cachedData,
      user,
      options,
      isCacheValidFor204,
    );
    if (!latest) {
      Log.debug('No response returned for latest value');
      return null;
    }

    const response = _typedJsonParse<{ has_updates: boolean }>(
      latest,
      'has_updates',
      'Response',
    );

    const sdkKey = this._getSdkKey();
    const stableID = StableID.get(sdkKey);

    let result: DataAdapterResult | null = null;
    if (response?.has_updates === true) {
      result = _makeDataAdapterResult('Network', latest, stableID, user);
    } else if (cachedData && response?.has_updates === false) {
      result = _makeDataAdapterResult(
        'NetworkNotModified',
        cachedData,
        stableID,
        user,
      );
    } else {
      return null;
    }

    const cacheKey = this._getCacheKey(user);
    this._inMemoryCache.add(cacheKey, result, this._cacheLimit);
    this._writeToCache(cacheKey, result);

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
    const cache = Storage.getItem?.(cacheKey);
    if (cache == null) {
      return null;
    }

    const result = _typedJsonParse<DataAdapterResult>(
      cache,
      'source',
      'Cached Result',
    );

    return result ? { ...result, source: 'Cache' } : null;
  }

  private _writeToCache(cacheKey: string, result: DataAdapterResult): void {
    const resultString = JSON.stringify(result);

    for (let i = 0; i < MAX_CACHE_WRITE_ATTEMPTS; i++) {
      try {
        Storage.setItem(cacheKey, resultString);
        break;
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !(
            error.toString().includes('QuotaExceededError') ||
            error.toString().includes('QUOTA_EXCEEDED_ERR')
          ) ||
          this._cacheLimit <= 1
        ) {
          throw error;
        }
        this._cacheLimit = Math.ceil(this._cacheLimit / 2);
        this._runLocalStorageCacheEviction(cacheKey, this._cacheLimit - 1);
      }
    }

    this._runLocalStorageCacheEviction(cacheKey);
  }

  private _runLocalStorageCacheEviction(
    cacheKey: string,
    cacheLimit: number = this._cacheLimit,
  ) {
    const lastModifiedTimeMap =
      _getObjectFromStorage<Record<string, number>>(
        this._lastModifiedStoreKey,
      ) ?? {};
    lastModifiedTimeMap[cacheKey] = Date.now();

    const evictableKeys = _getEvictableKeys(lastModifiedTimeMap, cacheLimit);
    for (const evictable of evictableKeys) {
      delete lastModifiedTimeMap[evictable];
      Storage.removeItem(evictable);
    }

    _setObjectInStorage(this._lastModifiedStoreKey, lastModifiedTimeMap);
  }
}

export function _makeDataAdapterResult(
  source: DataSource,
  data: string,
  stableID: string | null,
  user?: StatsigUser,
): DataAdapterResult {
  return {
    source,
    data,
    receivedAt: Date.now(),
    stableID,
    fullUserHash: _getFullUserHash(user),
  };
}

class InMemoryCache {
  private _data: Record<string, DataAdapterResult> = {};

  get(
    cacheKey: string,
    user: StatsigUserInternal | undefined,
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

  add(cacheKey: string, value: DataAdapterResult, cacheLimit: number) {
    const evictableKeys = _getEvictableKeys(this._data, cacheLimit - 1);
    for (const evictable of evictableKeys) {
      delete this._data[evictable];
    }

    this._data[cacheKey] = value;
  }

  merge(values: Record<string, DataAdapterResult>) {
    this._data = { ...this._data, ...values };
  }
}

function _getEvictableKeys(
  data: Record<string, number> | Record<string, { receivedAt: number }>,
  limit: number,
): string[] {
  const keys = Object.keys(data);
  if (keys.length <= limit) {
    return [];
  }
  if (limit === 0) {
    return keys;
  }

  return keys
    .sort((keyA, keyB) => {
      const valueA = data[keyA];
      const valueB = data[keyB];

      if (typeof valueA === 'object' && typeof valueB === 'object') {
        return valueA.receivedAt - valueB.receivedAt;
      }

      return (valueA as number) - (valueB as number);
    })
    .slice(0, keys.length - limit);
}
