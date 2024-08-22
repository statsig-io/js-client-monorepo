import { useState } from 'react';

import {
  AnyStatsigOptions,
  PrecomputedEvaluationsInterface,
  StatsigUser,
} from '@statsig/client-core';

import { requireOptionalClientDependency } from './requireOptionalDependency';

export function useClientAsyncInit(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: AnyStatsigOptions | null = null,
): { isLoading: boolean; client: PrecomputedEvaluationsInterface } {
  const [isLoading, setIsLoading] = useState(true);

  const [args] = useState(() => {
    const client = requireOptionalClientDependency(
      sdkKey,
      initialUser,
      statsigOptions,
    );

    client
      .initializeAsync()
      // eslint-disable-next-line no-console
      .catch(console.error)
      .finally(() => setIsLoading(false));

    return { client, initialUser, sdkKey };
  });

  return { client: args.client, isLoading };
}
