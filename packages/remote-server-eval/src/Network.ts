import { NetworkCore, StatsigUser } from 'dloomb-client-core';
import { SDK_TYPE } from './StatsigMetadata';
import { EvaluationResponse } from './EvaluationData';

export default class StatsigNetwork extends NetworkCore {
  constructor(sdkKey: string, stableID: string, api: string) {
    super(sdkKey, SDK_TYPE, stableID, api);
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
