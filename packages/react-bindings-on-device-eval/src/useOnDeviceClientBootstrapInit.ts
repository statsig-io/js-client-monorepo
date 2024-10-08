import { useMemo, useRef } from 'react';

import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export function useOnDeviceClientBootstrapInit(
  sdkKey: string,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigOnDeviceEvalClient {
  const clientRef = useRef<StatsigOnDeviceEvalClient | null>(null);

  return useMemo(() => {
    if (clientRef.current) {
      return clientRef.current;
    }

    const inst = new StatsigOnDeviceEvalClient(sdkKey, statsigOptions);
    clientRef.current = inst;

    inst.dataAdapter.setData(initialValues);
    inst.initializeSync();

    return inst;
  }, []);
}
