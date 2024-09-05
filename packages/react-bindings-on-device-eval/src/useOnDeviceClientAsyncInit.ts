import { useState } from 'react';

import { Log } from '@statsig/client-core';
import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export function useOnDeviceClientAsyncInit(
  sdkKey: string,
  statsigOptions: StatsigOptions | null = null,
): { isLoading: boolean; client: StatsigOnDeviceEvalClient } {
  const [isLoading, setIsLoading] = useState(true);

  const [args] = useState(() => {
    const client = new StatsigOnDeviceEvalClient(sdkKey, statsigOptions);

    client
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return { client, sdkKey };
  });

  return { client: args.client, isLoading };
}
