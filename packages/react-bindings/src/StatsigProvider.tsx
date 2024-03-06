import { ReactNode, useEffect, useState } from 'react';

import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigClientEventData,
  StatsigClientInterface,
  StatsigUser,
} from '@statsig/client-core';

import StatsigContext from './StatsigContext';

type Props = {
  children: ReactNode | ReactNode[];
} & (
  | { client: PrecomputedEvaluationsInterface; user: StatsigUser }
  | { client: OnDeviceEvaluationsInterface }
);

export default function StatsigProvider(props: Props): JSX.Element {
  const [renderVersion, setRenderVersion] = useState(0);
  const { client, children } = props;
  const user = 'user' in props ? props.user : null;

  useEffect(() => {
    const onStatusChange = (data: StatsigClientEventData) => {
      if (data.event === 'status_change') {
        setRenderVersion((v) => v + 1);
      }
    };

    client.on('status_change', onStatusChange);

    _initialize(props).catch((error) => {
      Log.error('An error occurred during initialization', error);
    });

    return () => {
      client.shutdown().catch((error) => {
        Log.error('An error occured during shutdown', error);
      });

      client.off('status_change', onStatusChange);
    };
  }, [client, user]);

  return (
    <StatsigContext.Provider value={{ renderVersion, client }}>
      {_shouldRender(client) ? children : null}
    </StatsigContext.Provider>
  );
}

function _initialize(props: Props) {
  if ('user' in props) {
    return props.client.initialize(props.user);
  }

  return props.client.initialize();
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
