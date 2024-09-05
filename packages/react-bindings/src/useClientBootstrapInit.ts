import { useState } from 'react';

import { StatsigUser } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

export function useClientBootstrapInit(
  sdkKey: string,
  initialUser: StatsigUser,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigClient {
  const [args] = useState(() => {
    const client = new StatsigClient(sdkKey, initialUser, statsigOptions);

    client.dataAdapter.setData(initialValues);
    client.initializeSync();

    return { client, initialValues, initialUser, sdkKey };
  });

  return args.client;
}
