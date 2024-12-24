import { useEffect, useRef, useState } from 'react';

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
  const clientRef = useRef<T>(
    (_getInstance(args.sdkKey) as T | null) ?? factory(args),
  );

  useEffect(() => {
    // already initializing or initialized
    if (clientRef.current.loadingStatus !== 'Uninitialized') {
      setIsLoading(false);
      return;
    }

    clientRef.current
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));
  }, []);

  return {
    client: clientRef.current,
    isLoading,
  };
}
