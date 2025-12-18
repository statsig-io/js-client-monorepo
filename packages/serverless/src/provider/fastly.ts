import {
  Endpoint,
  Log,
  NetworkArgs,
  NetworkDefault,
  StatsigUpdateDetails,
} from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-on-device-eval-client';

import { StatsigServerlessClient } from '../StatsigServerlessClient';

export class StatsigFastlyClient extends StatsigServerlessClient {
  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const userOverride = options?.networkConfig?.networkOverrideFunc;
    const fastlyNetworkOverride = async (url: string, args: NetworkArgs) => {
      if (userOverride) {
        return userOverride(url, args);
      }

      let backend: string | undefined;

      if (
        url.startsWith(`${NetworkDefault[Endpoint._rgstr]}/${Endpoint._rgstr}`)
      ) {
        backend = 'statsig_flush';
      } else if (
        url.startsWith(
          `${NetworkDefault[Endpoint._download_config_specs]}/${Endpoint._download_config_specs}`,
        )
      ) {
        backend = 'async_initialize';
      }
      return fetch(url, {
        ...args,
        backend,
      } as RequestInit);
    };

    const fastlyOptions: StatsigOptions = {
      ...options,
      networkConfig: {
        ...options?.networkConfig,
        networkOverrideFunc: fastlyNetworkOverride,
      },
    };

    super(sdkKey, fastlyOptions);
  }

  async initializeFromFastly(
    FastlyStoreType: 'kv' | 'config',
    storeId: string,
    keyId: string,
    apiToken: string,
  ): Promise<StatsigUpdateDetails> {
    const startTime = performance.now();
    let url: string;
    if (FastlyStoreType === 'kv') {
      url = `https://api.fastly.com/resources/stores/kv/${storeId}/keys/${keyId}`;
    } else if (FastlyStoreType === 'config') {
      url = `https://api.fastly.com/resources/stores/config/${storeId}/item/${keyId}`;
    } else {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: { message: 'Invalid Fastly store type' } as Error,
        sourceUrl: 'Invalid Fastly store type',
      };
    }
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Fastly-Key': apiToken,
          Accept: 'application/json',
        },
        backend: 'fastly_api',
      } as RequestInit);

      const res = await response.text();
      if (res) {
        let configData;
        if (FastlyStoreType === 'config') {
          const parsedRes = JSON.parse(res);
          configData = parsedRes.item_value;
        } else {
          configData = res;
        }

        this.dataAdapter.setData(configData);
        return this.initializeSync();
      }
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: {
          message: 'Config specs were not parsed successfully',
        } as Error,
        sourceUrl: url,
      };
    } catch (error) {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: {
          message: 'Failed to retrieve config specs from Fastly',
        } as Error,
        sourceUrl: url,
      };
    }
  }
}

interface FetchEvent {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
  waitUntil(promise: Promise<any>): void;
}

export interface StatsigFastlyHandler {
  (
    event: FetchEvent,
    client: StatsigFastlyClient,
  ): Promise<Response> | Response;
}

export interface StatsigFastlyHandlerParams {
  statsigSdkKey: string;
  fastlyStoreType: 'kv' | 'config';
  storeId: string;
  keyId: string;
  apiToken: string;
  statsigOptions?: StatsigOptions;
}

interface FastlyHandlerExport {
  (event: FetchEvent): Promise<Response>;
}

export function handleWithStatsig(
  handler: StatsigFastlyHandler,
  params: StatsigFastlyHandlerParams,
): FastlyHandlerExport {
  return async (event: FetchEvent) => {
    if (!params.statsigSdkKey || typeof params.statsigSdkKey !== 'string') {
      Log.error(`Invalid statsigSdkKey`);
    }

    if (!params.storeId || typeof params.storeId !== 'string') {
      Log.error(`Invalid storeId`);
    }

    if (!params.keyId || typeof params.keyId !== 'string') {
      Log.error(`Invalid keyId`);
    }

    if (!params.apiToken || typeof params.apiToken !== 'string') {
      Log.error(`Invalid apiToken`);
    }

    const client = new StatsigFastlyClient(
      params.statsigSdkKey,
      params.statsigOptions,
    );

    await client.initializeFromFastly(
      params.fastlyStoreType,
      params.storeId,
      params.keyId,
      params.apiToken,
    );

    const response = await handler(event, client);
    event.waitUntil(client.flush());
    return response;
  };
}
