import { Log, StatsigUpdateDetails } from '@statsig/client-core';
import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export class StatsigEdgeClient extends StatsigOnDeviceEvalClient {
  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const edgeSafeOptions: StatsigOptions = {
      disableStorage: true,
      loggingIntervalMs: 0,
      ...options,
    };
    super(sdkKey, edgeSafeOptions);
  }

  async initializeFromCloudflareKV(
    kvBinding: { get(key: string): Promise<string | null> },
    kvKey: string,
  ): Promise<StatsigUpdateDetails> {
    try {
      // default returns string
      const specs = await kvBinding.get(kvKey);

      if (specs) {
        this.dataAdapter.setData(specs);
        return this.initializeSync({
          disableBackgroundCacheRefresh: true,
        });
      } else {
        return this.initializeAsync();
      }
    } catch (error) {
      Log.error('Failed to fetch specs from Cloudflare KV:', error);
      return this.initializeAsync();
    }
  }

  async initializeFromVercel(ConfigKey: string): Promise<StatsigUpdateDetails> {
    const { getAll } = await import('@vercel/edge-config');
    const downloaded_specs = await getAll();

    if (downloaded_specs) {
      const specs = downloaded_specs[ConfigKey];
      if (!specs) {
        Log.error('Invalid Config Key');
        return this.initializeAsync();
      }
      this.dataAdapter.setData(JSON.stringify(specs));
      return this.initializeSync({
        disableBackgroundCacheRefresh: true,
      });
    } else {
      Log.error('Failed to fetch specs from vercel');
      return this.initializeAsync();
    }
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
        error: new Error('Invalid Fastly store type'),
        sourceUrl: 'Invalid Fastly store type',
      };
    }
    try {
      const response = await this._fetchFromFastly(url, {
        method: 'GET',
        headers: {
          'Fastly-Key': apiToken,
          Accept: 'application/json',
        },
        backend: 'fastly_api',
      });

      const res = await response.json();
      if (res) {
        let configData;
        if (FastlyStoreType === 'config') {
          configData = res.item_value;
        } else {
          configData = JSON.stringify(res);
        }
        if (configData) {
          this.dataAdapter.setData(configData);
          return this.initializeSync({
            disableBackgroundCacheRefresh: true,
          });
        }
      }
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error('Config specs were not parsed successfully'),
        sourceUrl: url,
      };
    } catch (error) {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error('Failed to retrieve config specs from Fastly'),
        sourceUrl: url,
      };
    }
  }

  private async _fetchFromFastly(
    url: string,
    options: RequestInit & { backend?: string },
  ) {
    const { backend, ...fetchOptions } = options;
    return fetch(url, {
      ...fetchOptions,
      backend,
    } as RequestInit);
  }

  async initializeFromCDN(url: string): Promise<StatsigUpdateDetails> {
    let response: Response;
    const startTime = performance.now();
    try {
      response = await fetch(url);
    } catch (error) {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error('Failed to retrieve config specs from CDN'),
        sourceUrl: url,
      };
    }

    if (!response.ok) {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error(
          `Retrieval from storage returned status ${response.status}`,
        ),
        sourceUrl: url,
      };
    }

    try {
      const specs = await response.json();
      this.dataAdapter.setData(JSON.stringify(specs));
      return this.initializeSync({
        disableBackgroundCacheRefresh: true,
      });
    } catch (error) {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error('Config specs were not parsed successfully'),
        sourceUrl: url,
      };
    }
  }
}
