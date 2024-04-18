import { ReactNode, useEffect, useState } from 'react';

import { Log, StatsigClientInterface } from '@statsig/client-core';

import StatsigContext from './StatsigContext';

export type StatsigProviderProps = {
  children: ReactNode | ReactNode[];
  client: StatsigClientInterface;
};

export function StatsigProvider({
  client,
  children,
}: StatsigProviderProps): JSX.Element {
  const [renderVersion, setRenderVersion] = useState(0);

  useEffect(() => {
    const onValuesUpdated = () => {
      setRenderVersion((v) => v + 1);
    };

    client.__on('values_updated', onValuesUpdated);

    return () => {
      client.shutdown().catch((error) => {
        Log.error('An error occured during shutdown', error);
      });

      client.off('values_updated', onValuesUpdated);
    };
  }, [client]);

  return (
    <StatsigContext.Provider value={{ renderVersion, client }}>
      {_shouldRender(client) ? children : null}
    </StatsigContext.Provider>
  );
}

function _shouldRender(client: StatsigClientInterface): boolean {
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
