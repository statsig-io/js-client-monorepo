import { useState } from 'react';

import {
  AnyStatsigOptions,
  Log,
  OnDeviceEvaluationsInterface,
} from '@statsig/client-core';

import { requireOptionalOnDeviceClientDependency } from './requireOptionalDependency';

export function useOnDeviceClientAsyncInit(
  sdkKey: string,
  statsigOptions: AnyStatsigOptions | null = null,
): { isLoading: boolean; client: OnDeviceEvaluationsInterface } {
  const [isLoading, setIsLoading] = useState(true);

  const [args] = useState(() => {
    const client = requireOptionalOnDeviceClientDependency(
      sdkKey,
      statsigOptions,
    );

    client
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return { client, sdkKey };
  });

  return { client: args.client, isLoading };
}
