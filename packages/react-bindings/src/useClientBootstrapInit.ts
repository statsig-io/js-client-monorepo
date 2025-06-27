import { StatsigUser } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

import { useStatsigInternalClientFactoryBootstrap } from './useStatsigInternalClientFactoryBootstrap';

export function useClientBootstrapInit(
  sdkKey: string,
  initialUser: StatsigUser,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
  useLegacyClient?: boolean,
): StatsigClient {
  return useStatsigInternalClientFactoryBootstrap(
    (args) =>
      new StatsigClient(args.sdkKey, args.initialUser, args.statsigOptions),
    {
      sdkKey,
      initialUser,
      initialValues,
      statsigOptions,
      useLegacyClient,
    },
  );
}
