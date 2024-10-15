import { StatsigUser } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-client';
import { useStatsigInternalClientFactoryAsync } from '@statsig/react-bindings';

import { StatsigClientRN } from './StatsigClientRN';

export function useClientAsyncInitRN(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: StatsigOptions | null = null,
): { isLoading: boolean; client: StatsigClientRN } {
  return useStatsigInternalClientFactoryAsync(
    (args) =>
      new StatsigClientRN(args.sdkKey, args.initialUser, args.statsigOptions),
    {
      sdkKey,
      initialUser,
      statsigOptions,
    },
  );
}
