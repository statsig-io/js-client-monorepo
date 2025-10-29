import {
  Endpoint,
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
        return this.initializeSync({
          disableBackgroundCacheRefresh: true,
        });
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
