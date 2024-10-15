import { StatsigUser } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

import { useStatsigInternalClientFactoryAsync } from './useStatsigInternalClientFactoryAsync';

export function useClientAsyncInit(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: StatsigOptions | null = null,
): { isLoading: boolean; client: StatsigClient } {
  return useStatsigInternalClientFactoryAsync(
    (args) =>
      new StatsigClient(args.sdkKey, args.initialUser, args.statsigOptions),
    {
      sdkKey,
      initialUser,
      statsigOptions,
    },
  );
}
