import {
  DataAdapterSyncOptions,
  StatsigUpdateDetails,
} from '@statsig/client-core';
import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export class StatsigServerlessClient extends StatsigOnDeviceEvalClient {
  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const edgeSafeOptions: StatsigOptions = {
      disableStorage: true,
      loggingEnabled: 'always',
      includeCurrentPageUrlWithEvents: false,
      ...options,
    };
    super(sdkKey, edgeSafeOptions);
  }

  override initializeSync(
    options?: DataAdapterSyncOptions,
  ): StatsigUpdateDetails {
    return super.initializeSync({
      disableBackgroundCacheRefresh: true,
      ...options,
    });
  }

  async initializeViaURL(url: string): Promise<StatsigUpdateDetails> {
    let response: Response;
    const startTime = performance.now();
    try {
      response = await fetch(url);
    } catch {
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error(`Failed to retrieve config specs from CDN`),
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
      return this.initializeSync();
    } catch {
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
