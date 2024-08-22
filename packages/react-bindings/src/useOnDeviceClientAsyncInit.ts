import { useState } from 'react';

import {
  AnyStatsigOptions,
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
      // eslint-disable-next-line no-console
      .catch(console.error)
      .finally(() => setIsLoading(false));

    return { client, sdkKey };
  });

  return { client: args.client, isLoading };
}
