import { useState } from 'react';

import {
  AnyStatsigOptions,
  OnDeviceEvaluationsInterface,
} from '@statsig/client-core';

import { requireOptionalOnDeviceClientDependency } from './requireOptionalDependency';

export function useOnDeviceClientBootstrapInit(
  sdkKey: string,
  initialValues: string,
  statsigOptions: AnyStatsigOptions | null = null,
): { client: OnDeviceEvaluationsInterface } {
  const [args] = useState(() => {
    const client = requireOptionalOnDeviceClientDependency(
      sdkKey,
      statsigOptions,
    );

    client.dataAdapter.setData(initialValues);
    client.initializeSync();

    return { client, initialValues, sdkKey };
  });

  return { client: args.client };
}
