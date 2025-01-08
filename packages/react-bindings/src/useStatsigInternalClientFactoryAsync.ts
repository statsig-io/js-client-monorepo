import { useMemo, useRef, useState } from 'react';

import { Log, StatsigUser, _getInstance } from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

type FactoryArgs = {
  sdkKey: string;
  initialUser: StatsigUser;
  statsigOptions: StatsigOptions | null;
};

export function useStatsigInternalClientFactoryAsync<T extends StatsigClient>(
  factory: (args: FactoryArgs) => T,
  args: FactoryArgs,
): { isLoading: boolean; client: T } {
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef<T | null>(_getInstance(args.sdkKey) as T | null);

  const client = useMemo(() => {
    if (clientRef.current) {
      // Repeat calls to initializeAsync return the same promise
      clientRef.current
        .initializeAsync()
        .catch(Log.error)
        .finally(() => setIsLoading(false));

      return clientRef.current;
    }

    const inst = factory(args);

    clientRef.current = inst;

    inst
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return inst;
  }, []);

  return { client, isLoading };
}
