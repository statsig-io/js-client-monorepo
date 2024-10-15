import { StatsigUser } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-client';
import { useStatsigInternalClientFactoryBootstrap } from '@statsig/react-bindings';

import { StatsigClientExpo } from './StatsigClientExpo';

export function useClientBootstrapInitExpo(
  sdkKey: string,
  initialUser: StatsigUser,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigClientExpo {
  return useStatsigInternalClientFactoryBootstrap(
    (args) =>
      new StatsigClientExpo(args.sdkKey, args.initialUser, args.statsigOptions),
    {
      sdkKey,
      initialUser,
      initialValues,
      statsigOptions,
    },
  );
}
