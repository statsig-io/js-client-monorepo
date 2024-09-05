import { useState } from 'react';

import { Log } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-on-device-eval-client';
import {
  StatsigProviderOnDeviceEval,
  StatsigProviderOnDeviceEvalProps,
} from '@statsig/react-bindings-on-device-eval';

import { StatsigOnDeviceEvalClientExpo } from './StatsigOnDeviceEvalClientExpo';

type Props = StatsigProviderOnDeviceEvalProps<StatsigOnDeviceEvalClientExpo>;

function useClientFactory(
  sdkKey: string,
  statsigOptions: StatsigOptions | null = null,
): StatsigOnDeviceEvalClientExpo {
  const [client] = useState(() => {
    const client = new StatsigOnDeviceEvalClientExpo(sdkKey, statsigOptions);

    client.initializeAsync().catch(Log.error);

    return client;
  });

  return client;
}

export function StatsigProviderOnDeviceEvalExpo(
  props: Props,
): JSX.Element | null {
  const { children, loadingComponent } = props;

  const client =
    'client' in props
      ? props.client
      : useClientFactory(props.sdkKey, props.options);

  return StatsigProviderOnDeviceEval({ children, loadingComponent, client });
}
