import { useMemo, useState } from 'react';

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
  const client = useMemo(
    () => (_getInstance(args.sdkKey) as T | undefined) ?? factory(args),
    [],
  );

  const [isLoading, setIsLoading] = useState(client.loadingStatus !== 'Ready');

  useMemo(() => {
    if (client.loadingStatus !== 'Ready') {
      // Repeat calls to initializeAsync return the same promise.
      // But if the client is already loaded, we don't want the promise
      // resolution to trigger an extra render on `setIsLoading(false)`
      client
        .initializeAsync()
        .catch(Log.error)
        .finally(() => setIsLoading(false));
    }
  }, []);

  return { client, isLoading };
}
