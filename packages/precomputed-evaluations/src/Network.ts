import { NetworkCore, StatsigUser } from '@sigstat/core';

import { EvaluationResponse } from './EvaluationData';

export default class StatsigNetwork extends NetworkCore {
  static DefaultApi = 'https://api.statsig.com/v1';

  constructor(
    sdkKey: string,
    private _api: string = StatsigNetwork.DefaultApi,
  ) {
    super(sdkKey);
  }

  fetchEvaluations(user: StatsigUser): Promise<EvaluationResponse | null> {
    return this.post({
      url: `${this._api}/initialize`,
      data: {
        user,
        hash: 'djb2',
      },
      timeoutMs: 2000,
      retries: 2,
    });
  }
}
