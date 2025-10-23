import { Log, StatsigUpdateDetails } from '@statsig/client-core';
import type { StatsigOptions } from '@statsig/js-on-device-eval-client';

import { StatsigServerlessClient } from '../StatsigServerlessClient';

type KVNamespace = {
  get(key: string): Promise<string | null>;
};

export type {
  StatsigUser,
  FeatureGateEvaluationOptions,
} from '@statsig/client-core';

export type { StatsigOptions } from '@statsig/js-on-device-eval-client';

export class StatsigCloudflareClient extends StatsigServerlessClient {
  async initializeFromKV(
    kvBinding: KVNamespace,
    kvKey: string,
  ): Promise<StatsigUpdateDetails> {
    const startTime = performance.now();
    if (!kvBinding) {
      Log.error('Invalid KV binding provided');
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error('Invalid KV binding provided'),
        sourceUrl: null,
      };
    }
    if (!kvKey || typeof kvKey !== 'string' || kvKey.trim().length === 0) {
      Log.error('Invalid KV key provided');
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error('Invalid KV key provided'),
        sourceUrl: null,
      };
    }
    try {
      const specs = await kvBinding.get(kvKey);
      if (specs) {
        this.dataAdapter.setData(specs);
        return this.initializeSync({
          disableBackgroundCacheRefresh: true,
        });
      } else {
        Log.error(
          `Failed to fetch specs from Cloudflare KV for key "${kvKey}"`,
        );
        return {
          duration: performance.now() - startTime,
          source: 'Bootstrap',
          success: false,
          error: new Error(
            `Failed to fetch specs from Cloudflare KV for key "${kvKey}"`,
          ),
          sourceUrl: null,
        };
      }
    } catch (error) {
      Log.error(
        `Failed to fetch specs from Cloudflare KV for key: "${kvKey}"`,
        error,
      );
      return {
        duration: performance.now() - startTime,
        source: 'Bootstrap',
        success: false,
        error: new Error(
          `Failed to fetch specs from Cloudflare KV for key: "${kvKey}"`,
        ),
        sourceUrl: null,
      };
    }
  }
}
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
}

type Env = Record<string, any>;

export interface statsig {
  (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    client: StatsigCloudflareClient,
  ): Promise<Response> | Response;
}

export interface paramsObject {
  kvKey: string;
  envStatsigKey: string;
  envKvBindingName: string;
  statsigOptions?: StatsigOptions;
}

interface WorkerExport {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
}

export function handleWithStatsig(
  handler: statsig,
  params: paramsObject,
): WorkerExport {
  return {
    async fetch(request, env, ctx) {
      const envStatsigKey = params.envStatsigKey;
      const envKvBindingName = params.envKvBindingName;
      const kvKey = params.kvKey;

      if (!env[envStatsigKey]) {
        return new Response(
          JSON.stringify({
            error: `Missing ${envStatsigKey} environment variable`,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (!env[envKvBindingName]) {
        return new Response(
          JSON.stringify({ error: `Missing ${envKvBindingName} Binding` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      const client = new StatsigCloudflareClient(
        env[envStatsigKey],
        params.statsigOptions,
      );
      await client.initializeFromKV(env[envKvBindingName], env[kvKey]);
      const response = await handler(request, env, ctx, client);
      ctx.waitUntil(client.flush());
      return response;
    },
  };
}
