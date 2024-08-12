import { ReactNode, useEffect, useMemo, useState } from 'react';

import { Log, SDKType, StatsigClientInterface } from '@statsig/client-core';

import StatsigContext from './StatsigContext';

export type StatsigProviderProps = {
  children: ReactNode | ReactNode[];
  client: StatsigClientInterface;
  loadingComponent?: ReactNode | ReactNode[];
};

export function StatsigProvider({
  client,
  children,
  loadingComponent,
}: StatsigProviderProps): JSX.Element {
  const [renderVersion, setRenderVersion] = useState(0);

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
      {loadingComponent == null || _isReady(client)
        ? children
        : loadingComponent}
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
