import { useMemo, useRef, useState } from 'react';

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
  const clientRef = useRef<StatsigOnDeviceEvalClient | null>(null);
  const client = useMemo(() => {
    if (clientRef.current) {
      return clientRef.current;
    }

    const inst = new StatsigOnDeviceEvalClient(sdkKey, statsigOptions);
    clientRef.current = inst;

    inst
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return inst;
  }, []);

  return { client, isLoading };
}
