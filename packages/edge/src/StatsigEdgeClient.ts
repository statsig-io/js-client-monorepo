import {
  DataAdapterAsyncOptions,
  DataAdapterSyncOptions,
  FeatureGateEvaluationOptions,
  Log,
  StatsigUpdateDetails,
  StatsigUser,
} from '@statsig/client-core';
import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export class StatsigEdgeClient {
  private _client: StatsigOnDeviceEvalClient;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const edgeSafeOptions: StatsigOptions = {
      disableStorage: true,
      loggingIntervalMs: 0,
      ...options,
    };
    this._client = new StatsigOnDeviceEvalClient(sdkKey, edgeSafeOptions);
  }

  async initializeAsync(options?: DataAdapterAsyncOptions): Promise<unknown> {
    return this._client.initializeAsync(options);
  }

  // If specs are provided, the data adapter will get populated
  // default to disabling background refresh to avoid a follow-up network call.
  initializeSync(specs?: string, options?: DataAdapterSyncOptions): unknown {
    if (specs) {
      this._client.dataAdapter.setData(specs);
      const merged: DataAdapterSyncOptions = {
        disableBackgroundCacheRefresh: true,
        ...options,
      };
      return this._client.initializeSync(merged);
    }
    return this._client.initializeSync(options);
  }

  async initializeFromCloudflareKV(
    kvBinding: { get(key: string): Promise<string | null> },
    kvKey: string,
  ): Promise<StatsigUpdateDetails> {
    try {
      // default returns string
      const specs = await kvBinding.get(kvKey);

      if (specs) {
        this._client.dataAdapter.setData(specs);
        return this._client.initializeSync({
          disableBackgroundCacheRefresh: true,
        });
      } else {
        return this._client.initializeAsync();
      }
    } catch (error) {
      Log.error('Failed to fetch specs from Cloudflare KV:', error);
      return this._client.initializeAsync();
    }
  }

  checkGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): boolean {
    return this._client.checkGate(name, user, options);
  }
}
