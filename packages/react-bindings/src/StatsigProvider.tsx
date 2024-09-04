import { ReactNode, useEffect, useMemo, useState } from 'react';

import {
  Log,
  SDKType,
  StatsigClientInterface,
  StatsigUser,
} from '@statsig/client-core';
import { StatsigClient, StatsigOptions } from '@statsig/js-client';

import StatsigContext from './StatsigContext';
import { useClientAsyncInit } from './useClientAsyncInit';

type WithClient = { client: StatsigClient };
type WithConfiguration = {
  sdkKey: string;
  user: StatsigUser;
  options?: StatsigOptions;
};

export type StatsigProviderProps = {
  children: ReactNode | ReactNode[];
  loadingComponent?: ReactNode | ReactNode[];
} & (WithClient | WithConfiguration);

export function StatsigProvider(props: StatsigProviderProps): JSX.Element {
  const [renderVersion, setRenderVersion] = useState(0);

  const client =
    'client' in props
      ? props.client
      : useClientAsyncInit(props.sdkKey, props.user).client;

  useEffect(() => {
    const onValuesUpdated = () => {
      setRenderVersion((v) => v + 1);
    };

    SDKType._setBindingType('react');

    client.$on('values_updated', onValuesUpdated);

    return () => {
      client
        .flush()
        .catch((err) => Log.error('An error occured during flush', err));

      client.off('values_updated', onValuesUpdated);
    };
  }, [client]);

  const contextValue = useMemo(
    () => ({ renderVersion, client }),
    [renderVersion, client],
  );

  return (
    <StatsigContext.Provider value={contextValue}>
      {props.loadingComponent == null || _isReady(client)
        ? props.children
        : props.loadingComponent}
    </StatsigContext.Provider>
  );
}

function _isReady(client: StatsigClientInterface): boolean {
  if ('isNoop' in client) {
    return true;
  }

  switch (client.loadingStatus) {
    case 'Ready':
      return true;
    default:
      return false;
  }
}
