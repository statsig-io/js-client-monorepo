import { useEffect, useState } from 'react';

import { Log, LogLevel } from '@statsig/client-core';
import { StatsigClient, StatsigUser } from '@statsig/js-client';

export default function useBootstrappedClient(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): StatsigClient {
  const [client] = useState(() => {
    const client = new StatsigClient(sdkKey, user, {
      logLevel: LogLevel.Debug,
    });

    return client;
  });

  useEffect(() => {
    client.dataAdapter.setData(values);
    client.initializeSync();

    return () => {
      client.shutdown().catch((error) => {
        Log.error('An error occured during shutdown', error);
      });
    };
  }, [client, sdkKey, user, values]);

  return client;
}
