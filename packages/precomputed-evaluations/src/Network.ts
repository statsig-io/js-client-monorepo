import { NetworkCore, StatsigUser } from '@statsig/client-core';

import { StatsigOptions } from './StatsigOptions';

const DEFAULT_API = 'https://api.statsig.com/v1';

export default class StatsigNetwork extends NetworkCore {
  private _api: string;

  constructor(options: StatsigOptions | null) {
    super(options);
    this._api = options?.api ?? DEFAULT_API;
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
