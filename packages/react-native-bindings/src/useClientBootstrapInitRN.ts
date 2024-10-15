import { StatsigUser } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-client';
import { useStatsigInternalClientFactoryBootstrap } from '@statsig/react-bindings';

import { StatsigClientRN } from './StatsigClientRN';

export function useClientBootstrapInitRN(
  sdkKey: string,
  initialUser: StatsigUser,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigClientRN {
  return useStatsigInternalClientFactoryBootstrap(
    (args) =>
      new StatsigClientRN(args.sdkKey, args.initialUser, args.statsigOptions),
    {
      sdkKey,
      initialUser,
      initialValues,
      statsigOptions,
    },
  );
}
