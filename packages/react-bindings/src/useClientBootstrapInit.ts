import { useMemo, useRef } from 'react';

import { StatsigUser } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

export function useClientBootstrapInit(
  sdkKey: string,
  initialUser: StatsigUser,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigClient {
  const clientRef = useRef<StatsigClient | null>(null);

  return useMemo(() => {
    if (clientRef.current) {
      return clientRef.current;
    }

    const inst = new StatsigClient(sdkKey, initialUser, statsigOptions);
    clientRef.current = inst;

    inst.dataAdapter.setData(initialValues);
    inst.initializeSync();

    return inst;
  }, []);
}
