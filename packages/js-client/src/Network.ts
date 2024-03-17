import {
  NetworkCore,
  StatsigClientEmitEventFunc,
  StatsigUser,
  _getOverridableUrl,
  typedJsonParse,
} from '@statsig/client-core';

import { EvaluationResponse } from './EvaluationData';
import { resolveDeltasResponse } from './EvaluationResponseDeltas';
import { StatsigOptions } from './StatsigOptions';

const DEFAULT_API = 'https://api.statsig.com/v1';
const DEFAULT_ENDPOINT = '/initialize';

type EvaluationsFetchArgs = {
  hash: 'djb2' | 'sha256' | 'none';
  deltasResponseRequested: boolean;
  user?: StatsigUser;
  sinceTime?: number;
  previousDerivedFields?: Record<string, unknown>;
};

export default class StatsigNetwork extends NetworkCore {
  private _initializeUrl: string;

  constructor(
    options: StatsigOptions | null,
    emitter?: StatsigClientEmitEventFunc,
  ) {
    super(options, emitter);

    this._initializeUrl = _getOverridableUrl(
      options?.initializeUrl,
      options?.api,
      DEFAULT_ENDPOINT,
      DEFAULT_API,
    );
  }

  async fetchEvaluations(
    sdkKey: string,
    current: string | null,
    user?: StatsigUser,
  ): Promise<string | null> {
    const cache = current
      ? typedJsonParse<EvaluationResponse>(
          current,
          'has_updates',
          'Failed to parse cached EvaluationResponse',
        )
      : null;

    let data: EvaluationsFetchArgs = {
      user,
      hash: 'djb2',
      deltasResponseRequested: false,
    };

    if (cache?.has_updates) {
      data = {
        ...data,
        sinceTime: cache.time,
        previousDerivedFields:
          'derived_fields' in cache ? cache.derived_fields : {},
        deltasResponseRequested: true,
      };
    }

    return this._fetchEvaluations(sdkKey, cache, data);
  }

  private async _fetchEvaluations(
    sdkKey: string,
    cache: EvaluationResponse | null,
    data: EvaluationsFetchArgs,
  ): Promise<string | null> {
    const response = await this.post({
      sdkKey,
      url: this._initializeUrl,
      data,
      retries: 2,
    });

    if (response?.code === 204) {
      return '{"has_updates": false}';
    }

    if (response?.code !== 200) {
      return response?.body ?? null;
    }

    if (
      cache?.has_updates !== true ||
      response.body?.includes('"is_delta":true') !== true
    ) {
      return response.body;
    }

    const result = resolveDeltasResponse(cache, response.body);
    if (typeof result === 'string') {
      return result;
    }

    // retry without deltas
    return this._fetchEvaluations(sdkKey, cache, {
      ...data,
      ...result,
      deltasResponseRequested: false,
    });
  }
}
