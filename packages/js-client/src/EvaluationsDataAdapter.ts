import {
  DataAdapterCore,
  StatsigOptionsCommon,
  StatsigUser,
} from '@statsig/client-core';

import { EvaluationResponse } from './EvaluationData';
import Network from './Network';

export class EvaluationsDataAdapter extends DataAdapterCore<EvaluationResponse> {
  private _network: Network | null = null;

  constructor() {
    super('EvaluationsDataAdapter', 'evaluations');
  }

  override attach(sdkKey: string, options: StatsigOptionsCommon | null): void {
    super.attach(sdkKey, options);
    this._network = new Network(options ?? {});
  }

  setDataForUser(user: StatsigUser, data: string): void {
    const cacheKey = this._getCacheKey(user);
    this._addToInMemoryCache(cacheKey, {
      source: 'Bootstrap',
      data,
      receivedAt: Date.now(),
    });
  }

  async prefetchDataForUser(user: StatsigUser): Promise<void> {
    const cacheKey = this._getCacheKey(user);
    const result = await this.getDataAsync(null, user);
    if (result) {
      this._addToInMemoryCache(cacheKey, { ...result, source: 'Prefetch' });
    }
  }

  protected override async _fetchFromNetwork(
    current: string | null,
    user?: StatsigUser,
  ): Promise<string | null> {
    const result = await this._network?.fetchEvaluations(
      this._getSdkKey(),
      current,
      user,
    );
    return result ?? null;
  }
}
