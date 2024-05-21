import {
  InitializeResponse,
  NetworkCore,
  NetworkDefault,
  NetworkPriority,
  StatsigClientEmitEventFunc,
  StatsigUser,
  _getOverridableUrl,
  _typedJsonParse,
} from '@statsig/client-core';

import { _resolveDeltasResponse } from './EvaluationResponseDeltas';
import { StatsigOptions } from './StatsigOptions';

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

    const config = options?.networkConfig;
    this._initializeUrl = _getOverridableUrl(
      config?.initializeUrl,
      config?.api,
      '/initialize',
      NetworkDefault.initializeApi,
    );
  }

  async fetchEvaluations(
    sdkKey: string,
    current: string | null,
    priority?: NetworkPriority,
    user?: StatsigUser,
  ): Promise<string | null> {
    const cache = current
      ? _typedJsonParse<InitializeResponse>(
          current,
          'has_updates',
          'InitializeResponse',
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

    return this._fetchEvaluations(sdkKey, cache, data, priority);
  }

  private async _fetchEvaluations(
    sdkKey: string,
    cache: InitializeResponse | null,
    data: EvaluationsFetchArgs,
    priority?: NetworkPriority,
  ): Promise<string | null> {
    const response = await this.post({
      sdkKey,
      url: this._initializeUrl,
      data,
      retries: 2,
      isStatsigEncodable: true,
      priority,
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

    const result = _resolveDeltasResponse(cache, response.body);
    if (typeof result === 'string') {
      return result;
    }

    // retry without deltas
    return this._fetchEvaluations(
      sdkKey,
      cache,
      {
        ...data,
        ...result,
        deltasResponseRequested: false,
      },
      priority,
    );
  }
}
