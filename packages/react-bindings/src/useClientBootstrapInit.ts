import { useState } from 'react';

import {
  AnyStatsigOptions,
  PrecomputedEvaluationsInterface,
  StatsigUser,
} from '@statsig/client-core';

import { requireOptionalClientDependency } from './requireOptionalDependency';

export function useClientBootstrapInit(
  sdkKey: string,
  initialUser: StatsigUser,
  initialValues: string,
  statsigOptions: AnyStatsigOptions | null = null,
): { client: PrecomputedEvaluationsInterface } {
  const [args] = useState(() => {
    const client = requireOptionalClientDependency(
      sdkKey,
      initialUser,
      statsigOptions,
    );

    client.dataAdapter.setData(initialValues);
    client.initializeSync();

    return { client, initialValues, initialUser, sdkKey };
  });

  return { client: args.client };
}
