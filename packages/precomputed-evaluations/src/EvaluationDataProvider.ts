import { StatsigUser, getUserStorageKey } from '@sigstat/core';

import { EvaluationResponse } from './EvaluationData';
import StatsigNetwork from './Network';

export interface EvaluationDataProviderInterface {
  getEvaluationsForUser(user: StatsigUser): EvaluationResponse | null;
}

export class LocalEvaluationDataProvider
  implements EvaluationDataProviderInterface
{
  private _data: { [userID: string]: EvaluationResponse } = {};

  constructor(private _sdkKey: string) {}

  getEvaluationsForUser(user: StatsigUser): EvaluationResponse | null {
    const key = getUserStorageKey(user, this._sdkKey);
    return this._data[key];
  }

  addEvaluationsForUser(
    user: StatsigUser,
    evaluations: EvaluationResponse,
  ): void {
    const key = getUserStorageKey(user, this._sdkKey);
    this._data[key] = evaluations;
  }
}

export class PrefetchEvaluationDataProvider
  implements EvaluationDataProviderInterface
{
  private _network: StatsigNetwork;
  private _sdkKey: string;
  private _data: { [userID: string]: EvaluationResponse } = {};

  constructor(sdkKey: string, api?: string) {
    this._sdkKey = sdkKey;
    this._network = new StatsigNetwork(sdkKey, api);
  }

  getEvaluationsForUser(user: StatsigUser): EvaluationResponse | null {
    const key = getUserStorageKey(user, this._sdkKey);
    return this._data[key];
  }

  async prefetchEvaluationsForUser(user: StatsigUser): Promise<void> {
    const response = await this._network.fetchEvaluations(user);
    if (response) {
      const key = getUserStorageKey(user, this._sdkKey);
      this._data[key] = response;
    }
  }
}
