import * as React from 'react';
import { useState } from 'react';

import { Log } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-on-device-eval-client';
import {
  StatsigProviderOnDeviceEval,
  StatsigProviderOnDeviceEvalProps,
} from '@statsig/react-bindings-on-device-eval';

import { StatsigOnDeviceEvalClientRN } from './StatsigOnDeviceEvalClientRN';

type Props = StatsigProviderOnDeviceEvalProps<StatsigOnDeviceEvalClientRN>;

function useClientFactory(
  sdkKey: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigOnDeviceEvalClientRN {
  const [client] = useState(() => {
    const client = new StatsigOnDeviceEvalClientRN(sdkKey, statsigOptions);

    client.initializeAsync().catch(Log.error);

    return client;
  });

  return client;
}

export function StatsigProviderOnDeviceEvalRN(
  props: Props,
): React.ReactElement | null {
  const { children, loadingComponent } = props;

  const client =
    'client' in props
      ? props.client
      : useClientFactory(props.sdkKey, props.options);

  return StatsigProviderOnDeviceEval({ children, loadingComponent, client });
}
