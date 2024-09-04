import { useState } from 'react';

import { Log, StatsigUser } from '@statsig/client-core';
import { StatsigOptions } from '@statsig/js-client';
import { StatsigProvider, StatsigProviderProps } from '@statsig/react-bindings';

import { StatsigClientRN } from './StatsigClientRN';

type Props = StatsigProviderProps<StatsigClientRN>;

function useClientFactory(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: StatsigOptions | null = null,
): StatsigClientRN {
  const [client] = useState(() => {
    const client = new StatsigClientRN(sdkKey, initialUser, statsigOptions);

    client.initializeAsync().catch(Log.error);

    return client;
  });

  return client;
}

export function StatsigProviderRN(props: Props): JSX.Element | null {
  const { children, loadingComponent } = props;

  const client =
    'client' in props
      ? props.client
      : useClientFactory(props.sdkKey, props.user, props.options);

  return StatsigProvider({ children, loadingComponent, client });
}
