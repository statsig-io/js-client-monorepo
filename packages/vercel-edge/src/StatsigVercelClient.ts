import { get } from '@vercel/edge-config';
import { waitUntil } from '@vercel/functions';

import { Log, StatsigUpdateDetails } from '@statsig/client-core';
import type { StatsigOptions } from '@statsig/js-on-device-eval-client';
import { StatsigServerlessClient } from '@statsig/serverless-client';

export class StatsigVercelClient extends StatsigServerlessClient {
  async initializeFromEdgeConfig(
    ConfigKey: string,
  ): Promise<StatsigUpdateDetails> {
    const startTime = performance.now();
    try {
      const specs = await get(ConfigKey);
      if (!specs) {
        Log.error(
          `Failed to fetch specs from Vercel Edge Config with key: ${ConfigKey}`,
        );
        return {
          duration: performance.now() - startTime,
          source: 'Bootstrap',
          success: false,
          error: {
            message: `Failed to fetch specs from Vercel Edge Config with key: ${ConfigKey}`,
          } as Error,
          sourceUrl: null,
        };
      }
      let specsData;
      if (typeof specs === 'string') {
        specsData = specs;
      } else {
        specsData = JSON.stringify(specs);
      }
      this.dataAdapter.setData(specsData);
      return this.initializeSync({
        disableBackgroundCacheRefresh: true,
      });
    } catch {
      Log.error(`Failed to fetch specs from Vercel Edge Config`);
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: {
          message: `Failed to fetch specs from Vercel Edge Config`,
        } as Error,
        sourceUrl: null,
      };
    }
  }
}

export interface statsig {
  (request: Request, client: StatsigVercelClient): Promise<Response> | Response;
}

interface VercelWrapperExport {
  (request: Request): Promise<Response>;
}

export function handleWithStatsig(
  handler: statsig,
  params: {
    configKey: string;
    statsigSdkKey: string;
    statsigOptions?: StatsigOptions;
  },
): VercelWrapperExport {
  return async (request: Request) => {
    if (!params.configKey || typeof params.configKey !== 'string') {
      Log.error(`Invalid configKey`);
    }

    if (!params.statsigSdkKey || typeof params.statsigSdkKey !== 'string') {
      Log.error(`Invalid statsigSdkKey`);
    }

    const client = new StatsigVercelClient(
      params.statsigSdkKey,
      params.statsigOptions,
    );

    await client.initializeFromEdgeConfig(params.configKey);
    const response = await handler(request, client);
    waitUntil(client.flush());
    return response;
  };
}
