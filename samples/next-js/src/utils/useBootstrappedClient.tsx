import { useMemo } from 'react';

import { LogLevel } from '@statsig/client-core';
import { StatsigClient, StatsigUser } from '@statsig/js-client';

export default function useBootstrappedClient(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): StatsigClient {
  const client = useMemo(() => {
    const client = new StatsigClient(sdkKey, user, {
      logLevel: LogLevel.Debug,
    });
    client.dataAdapter.setData(values);
    client.initializeSync();
    return client;
  }, [sdkKey, user, values]);

  return client;
}
