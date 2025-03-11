import * as React from 'react';
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

type WithClient<T extends StatsigClient> = { client: T };
type WithConfiguration = {
  sdkKey: string;
  user: StatsigUser;
  options?: StatsigOptions;
};
type ProviderChildrenProps = {
  children: ReactNode | ReactNode[];
  loadingComponent?: ReactNode | ReactNode[];
};

export type StatsigProviderProps<T extends StatsigClient> =
  ProviderChildrenProps & (WithClient<T> | WithConfiguration);

export function StatsigProvider(
  props: StatsigProviderProps<StatsigClient>,
): React.ReactElement {
  if (!('client' in props)) {
    return <ConfigBasedStatsigProvider {...props} />;
  }

  if ('sdkKey' in props || 'user' in props) {
    Log.warn(
      'Both client and configuration props (sdkKey, user) were provided to StatsigProvider. The client prop will be used and the configuration props will be ignored.',
    );
  }
  return <ClientBasedStatsigProvider {...props} />;
}

function ConfigBasedStatsigProvider(
  props: WithConfiguration & ProviderChildrenProps,
): React.ReactElement {
  const [renderVersion, setRenderVersion] = useState(0);
  const client = useClientAsyncInit(
    props.sdkKey,
    props.user,
    props.options,
  ).client;

  useStatsigClientSetup(client, setRenderVersion);
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

function ClientBasedStatsigProvider<T extends StatsigClient>(
  props: WithClient<T> & ProviderChildrenProps,
): React.ReactElement {
  const [renderVersion, setRenderVersion] = useState(0);
  const client = props.client;

  useStatsigClientSetup(client, setRenderVersion);
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

function useStatsigClientSetup(
  client: StatsigClientInterface,
  setRenderVersion: React.Dispatch<React.SetStateAction<number>>,
): void {
  useEffect(() => {
    const onValuesUpdated = () => {
      setRenderVersion((v) => v + 1);
    };

    SDKType._setBindingType('react');

    client.$on('values_updated', onValuesUpdated);

    return () => {
      client
        .flush()
        .catch((err) => Log.error('An error occurred during flush', err));

      client.off('values_updated', onValuesUpdated);
    };
  }, [client, setRenderVersion]);
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
