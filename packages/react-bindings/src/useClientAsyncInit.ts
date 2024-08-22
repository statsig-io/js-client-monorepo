import { useState } from 'react';

import {
  AnyStatsigOptions,
  Log,
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
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return { client, initialUser, sdkKey };
  });

  return { client: args.client, isLoading };
}
