import {
  Log,
  NetworkCore,
  StatsigClientEmitEventFunc,
  StatsigUser,
} from '@statsig/client-core';

import { EvaluationResponse } from './EvaluationData';
import { StatsigOptions } from './StatsigOptions';

const DEFAULT_API = 'https://api.statsig.com/v1';

export default class StatsigNetwork extends NetworkCore {
  private _api: string;

  constructor(
    options: StatsigOptions | null,
    emitter?: StatsigClientEmitEventFunc,
  ) {
    super(options, emitter);
    this._api = options?.api ?? DEFAULT_API;
  }

  async fetchEvaluations(
    sdkKey: string,
    current: string | null,
    user?: StatsigUser,
  ): Promise<string | null> {
    let data: Record<string, unknown> = {
      user,
      hash: 'djb2',
    };

    let cache: EvaluationResponse | null = null;
    try {
      cache = current ? (JSON.parse(current) as EvaluationResponse) : null;
    } catch {
      Log.debug('Failed to parse cached EvaluationResponse');
    }

    if (cache?.has_updates) {
      data = {
        ...data,
        sinceTime: cache.time,
        previousDerivedFields:
          'derived_fields' in cache ? cache.derived_fields : {},
      };
    }

    const response = await this.post({
      sdkKey,
      url: `${this._api}/initialize`,
      data,
      timeoutMs: 2000,
      retries: 2,
    });

    if (response?.code === 204) {
      return '{"has_updates": false}';
    }

    return response?.body ?? null;
  }
}
