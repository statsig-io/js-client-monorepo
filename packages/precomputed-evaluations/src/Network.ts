import { NetworkCore, StatsigUser } from '@statsig/client-core';

import { EvaluationResponse } from './EvaluationData';
import { StatsigOptions } from './StatsigOptions';

const DEFAULT_API = 'https://api.statsig.com/v1';

export default class StatsigNetwork extends NetworkCore {
  private _api: string;

  constructor(options: StatsigOptions | null) {
    super(options);
    this._api = options?.api ?? DEFAULT_API;
  }

  fetchEvaluations(
    sdkKey: string,
    current: EvaluationResponse | null,
    user?: StatsigUser,
  ): Promise<string | null> {
    let data: Record<string, unknown> = {
      user,
      hash: 'djb2',
    };

    if (current?.has_updates) {
      data = {
        ...data,
        sinceTime: current.time,
        previousDerivedFields:
          'derived_fields' in current ? current.derived_fields : {},
      };
    }

    return this.post({
      sdkKey,
      url: `${this._api}/initialize`,
      data,
      timeoutMs: 2000,
      retries: 2,
    });
  }
}
