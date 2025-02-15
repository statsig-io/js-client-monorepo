import {
  Endpoint,
  InitializeResponse,
  NetworkCore,
  NetworkPriority,
  StatsigClientEmitEventFunc,
  StatsigUser,
  UrlConfiguration,
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
  full_checksum?: string | null;
};

export default class StatsigNetwork extends NetworkCore {
  private _initializeUrlConfig: UrlConfiguration;

  constructor(
    options: StatsigOptions | null,
    emitter?: StatsigClientEmitEventFunc,
  ) {
    super(options, emitter);

    const config = options?.networkConfig;
    this._initializeUrlConfig = new UrlConfiguration(
      Endpoint._initialize,
      config?.initializeUrl,
      config?.api,
      config?.initializeFallbackUrls,
    );
  }

  async fetchEvaluations(
    sdkKey: string,
    current: string | null,
    priority?: NetworkPriority,
    user?: StatsigUser,
    isCacheValidFor204?: boolean,
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
      full_checksum: null,
    };

    if (cache?.has_updates) {
      data = {
        ...data,
        sinceTime: isCacheValidFor204 ? cache.time : 0,
        previousDerivedFields:
          'derived_fields' in cache && isCacheValidFor204
            ? cache.derived_fields
            : {},
        deltasResponseRequested: true,
        full_checksum: cache.full_checksum,
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
      urlConfig: this._initializeUrlConfig,
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
      response.body?.includes('"is_delta":true') !== true ||
      data.deltasResponseRequested !== true
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
