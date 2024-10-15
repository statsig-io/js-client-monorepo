import { StatsigUser } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-client';
import { useStatsigInternalClientFactoryAsync } from '@statsig/react-bindings';

import { StatsigClientExpo } from './StatsigClientExpo';

export function useClientAsyncInitExpo(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: StatsigOptions | null = null,
): { isLoading: boolean; client: StatsigClientExpo } {
  return useStatsigInternalClientFactoryAsync(
    (args) =>
      new StatsigClientExpo(args.sdkKey, args.initialUser, args.statsigOptions),
    {
      sdkKey,
      initialUser,
      statsigOptions,
    },
  );
}
