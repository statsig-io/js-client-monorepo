import { useState } from 'react';

import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export function useOnDeviceClientBootstrapInit(
  sdkKey: string,
  initialValues: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigOnDeviceEvalClient {
  const [args] = useState(() => {
    const client = new StatsigOnDeviceEvalClient(sdkKey, statsigOptions);

    client.dataAdapter.setData(initialValues);
    client.initializeSync();

    return { client, initialValues, sdkKey };
  });

  return args.client;
}
