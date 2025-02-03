import {
  AnyStatsigOptions,
  DataAdapterAsyncOptions,
  DataAdapterCachePrefix,
  DataAdapterCore,
  DataAdapterResult,
  SpecsDataAdapter,
  StatsigUser,
  _getStorageKey,
} from '@statsig/client-core';

export class StatsigLocalSpecsDataAdapter
  extends DataAdapterCore
  implements SpecsDataAdapter
{
  constructor() {
    super('StatsigLocalSpecsDataAdapter', 'specs');
  }

  override attach(sdkKey: string, options: AnyStatsigOptions | null): void {
    super.attach(sdkKey, options);
  }

  getDataAsync(
    _current: DataAdapterResult | null,
    _options?: DataAdapterAsyncOptions,
  ): Promise<DataAdapterResult | null> {
    // noop
    return Promise.resolve(null);
  }

  prefetchData(_options?: DataAdapterAsyncOptions): Promise<void> {
    // noop
    return Promise.resolve();
  }

  protected override _fetchFromNetwork(
    _current: string | null,
    _user?: StatsigUser,
    _options?: DataAdapterAsyncOptions,
  ): Promise<string | null> {
    // noop
    return Promise.resolve(null);
  }

  protected override _getCacheKey(): string {
    const key = _getStorageKey(this._getSdkKey());
    return `${DataAdapterCachePrefix}.${this._cacheSuffix}.${key}`;
  }

  protected override _isCachedResultValidFor204(
    result: DataAdapterResult,
    _user: StatsigUser | undefined,
  ): boolean {
    // Simply having a cache value makes it valid
    return result.data.length > 0;
  }
}
