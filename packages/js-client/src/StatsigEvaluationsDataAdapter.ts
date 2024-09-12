import {
  DataAdapterAsyncOptions,
  DataAdapterCachePrefix,
  DataAdapterCore,
  DataAdapterResult,
  EvaluationsDataAdapter,
  InitializeResponse,
  Log,
  StatsigUser,
  StatsigUserInternal,
  _getFullUserHash,
  _getStorageKey,
  _normalizeUser,
  _typedJsonParse,
} from '@statsig/client-core';

import Network from './Network';
import { StatsigOptions } from './StatsigOptions';

export class StatsigEvaluationsDataAdapter
  extends DataAdapterCore
  implements EvaluationsDataAdapter
{
  private _network: Network | null = null;
  protected override _options: StatsigOptions | null = null;

  constructor() {
    super('EvaluationsDataAdapter', 'evaluations');
  }

  override attach(sdkKey: string, options: StatsigOptions | null): void {
    super.attach(sdkKey, options);
    this._network = new Network(options ?? {});
  }

  getDataAsync(
    current: DataAdapterResult | null,
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<DataAdapterResult | null> {
    return this._getDataAsyncImpl(
      current,
      _normalizeUser(user, this._options),
      options,
    );
  }

  prefetchData(
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<void> {
    return this._prefetchDataImpl(user, options);
  }

  override setData(data: string): void {
    const values = _typedJsonParse<InitializeResponse>(
      data,
      'has_updates',
      'data',
    );

    if (values && 'user' in values) {
      super.setData(data, values.user);
    } else {
      Log.error(
        'StatsigUser not found. You may be using an older server SDK version. Please upgrade your SDK or use setDataLegacy.',
      );
    }
  }

  setDataLegacy(data: string, user: StatsigUser): void {
    super.setData(data, user);
  }

  protected override async _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ): Promise<string | null> {
    const result = await this._network?.fetchEvaluations(
      this._getSdkKey(),
      current,
      options?.priority,
      user,
    );
    return result ?? null;
  }

  protected override _getCacheKey(user?: StatsigUserInternal): string {
    const key = _getStorageKey(
      this._getSdkKey(),
      user,
      this._options?.customUserCacheKeyFunc,
    );
    return `${DataAdapterCachePrefix}.${this._cacheSuffix}.${key}`;
  }

  protected override _isCachedResultValidFor204(
    result: DataAdapterResult,
    user: StatsigUser | undefined,
  ): boolean {
    return (
      result.fullUserHash != null &&
      result.fullUserHash === _getFullUserHash(user)
    );
  }
}
