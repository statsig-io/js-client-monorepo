import { useMemo, useRef, useState } from 'react';

import { Log, StatsigUser } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

export function useClientAsyncInit(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: StatsigOptions | null = null,
): { isLoading: boolean; client: StatsigClient } {
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef<StatsigClient | null>(null);
  const client = useMemo(() => {
    if (clientRef.current) {
      return clientRef.current;
    }

    const inst = new StatsigClient(sdkKey, initialUser, statsigOptions);
    clientRef.current = inst;

    inst
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return inst;
  }, []);

  return { client, isLoading };
}
