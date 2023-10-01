import { NetworkCore, StatsigUser } from '@sigstat/core';

import { EvaluationResponse } from './EvaluationData';

export default class StatsigNetwork extends NetworkCore {
  constructor(sdkKey: string, api: string) {
    super(sdkKey, api);
  }

  fetchEvaluations(user: StatsigUser): Promise<EvaluationResponse> {
    return this._sendPostRequest(
      `${this._api}/initialize`,
      {
        user,
        hash: 'djb2',
      },
      2000,
    );
  }
}
