import {
  StatsigDataProvider,
  StatsigUser,
  getUserStorageKey,
} from '@statsig/client-core';

import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

export class PrefetchEvaluationDataProvider implements StatsigDataProvider {
  readonly source = 'Prefetch';

  private _network: StatsigNetwork;
  private _data: Record<string, string> = {};

  constructor(options: StatsigOptions | null = null) {
    this._network = new StatsigNetwork(options);
  }

  getData(sdkKey: string, user?: StatsigUser): string | null {
    const key = getUserStorageKey(sdkKey, user);
    return this._data[key];
  }

  async prefetchEvaluationsForUser(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<void> {
    const response = await this._network.fetchEvaluations(sdkKey, user);
    if (response) {
      const key = getUserStorageKey(sdkKey, user);
      this._data[key] = response;
    }
  }
}
