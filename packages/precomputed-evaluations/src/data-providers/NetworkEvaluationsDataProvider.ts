import { StatsigUser } from '@sigstat/core';

import {
  EvaluationDataProviderInterface,
  EvaluationSource,
} from '../EvaluationDataProvider';
import StatsigNetwork from '../Network';
import { StatsigOptions } from '../StatsigOptions';

export class NetworkEvaluationsDataProvider
  implements EvaluationDataProviderInterface
{
  static create(
    options: StatsigOptions | null = null,
  ): NetworkEvaluationsDataProvider {
    return new NetworkEvaluationsDataProvider(new StatsigNetwork(options?.api));
  }

  constructor(private _network: StatsigNetwork) {}

  async getEvaluationsData(
    sdkKey: string,
    user: StatsigUser,
  ): Promise<string | null> {
    const response = await this._network.fetchEvaluations(sdkKey, user);
    return response;
  }

  isTerminal(): boolean {
    return false;
  }

  source(): EvaluationSource {
    return 'Network';
  }
}
