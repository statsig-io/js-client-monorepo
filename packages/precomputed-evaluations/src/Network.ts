import { NetworkCore, StatsigUser } from '@sigstat/core';

import { StatsigOptions } from './StatsigOptions';

export default class StatsigNetwork extends NetworkCore {
  static DefaultApi = 'https://api.statsig.com/v1';

  private _api: string;

  constructor(options: StatsigOptions | null) {
    super(options);
    this._api = options?.api ?? StatsigNetwork.DefaultApi;
  }

  fetchEvaluations(sdkKey: string, user?: StatsigUser): Promise<string | null> {
    return this.post({
      sdkKey,
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
