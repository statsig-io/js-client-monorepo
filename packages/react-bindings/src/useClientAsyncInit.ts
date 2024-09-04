import { useState } from 'react';

import { Log, StatsigUser } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

export function useClientAsyncInit(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: StatsigOptions | null = null,
): { isLoading: boolean; client: StatsigClient } {
  const [isLoading, setIsLoading] = useState(true);

  const [args] = useState(() => {
    const client = new StatsigClient(sdkKey, initialUser, statsigOptions);

    client
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return { client, initialUser, sdkKey };
  });

  return { client: args.client, isLoading };
}
