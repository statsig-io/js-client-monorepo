import { NetworkCore, StatsigUser } from '@sigstat/core';

export default class StatsigNetwork extends NetworkCore {
  static DefaultApi = 'https://api.statsig.com/v1';

  constructor(private _api: string = StatsigNetwork.DefaultApi) {
    super();
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
