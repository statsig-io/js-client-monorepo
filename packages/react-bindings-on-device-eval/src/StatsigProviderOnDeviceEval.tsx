import * as React from 'react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { Log, SDKType, StatsigClientInterface } from '@statsig/client-core';
import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

import StatsigContext from './StatsigContext';
import { useOnDeviceClientAsyncInit } from './useOnDeviceClientAsyncInit';

type WithClient<T extends StatsigOnDeviceEvalClient> = { client: T };
type WithConfiguration = {
  sdkKey: string;
  options?: StatsigOptions;
};

export type StatsigProviderOnDeviceEvalProps<
  T extends StatsigOnDeviceEvalClient,
> = {
  children: ReactNode | ReactNode[];
  loadingComponent?: ReactNode | ReactNode[];
} & (WithClient<T> | WithConfiguration);

export function StatsigProviderOnDeviceEval(
  props: StatsigProviderOnDeviceEvalProps<StatsigOnDeviceEvalClient>,
): React.ReactElement {
  const [renderVersion, setRenderVersion] = useState(0);

  const client =
    'client' in props
      ? props.client
      : useOnDeviceClientAsyncInit(props.sdkKey, props.options).client;

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
