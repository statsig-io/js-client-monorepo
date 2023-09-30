import { NetworkCore, StatsigUser } from '@sigstat/core';

import { EvaluationResponse } from './EvaluationData';
import { StatsigMetadata } from './StatsigMetadata';

export default class StatsigNetwork extends NetworkCore {
  constructor(sdkKey: string, stableID: string, api: string) {
    super(sdkKey, StatsigMetadata, stableID, api);
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
