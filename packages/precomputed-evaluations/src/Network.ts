import { NetworkCore, StatsigUser } from '@sigstat/core';

import { EvaluationResponse } from './EvaluationData';

export default class StatsigNetwork extends NetworkCore {
  constructor(sdkKey: string, api: string) {
    super(sdkKey, api);
  }

  fetchEvaluations(user: StatsigUser): Promise<EvaluationResponse | null> {
    return this.post({
      url: `initialize`,
      data: {
        user,
        hash: 'djb2',
      },
      timeoutMs: 2000,
      retries: 2,
    });
  }
}
