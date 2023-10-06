import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigClientEventData,
  StatsigClientInterface,
} from '@sigstat/core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecompoutedEvaluationsClient } from './OnDeviceVsPrecomputedUtils';
import StatsigContext from './StatsigContext';

type Props = {
  children: ReactNode | ReactNode[];
} & (
  | {
      client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface;
    }
  | {
      precomputedClient: PrecomputedEvaluationsInterface;
      onDeviceClient: OnDeviceEvaluationsInterface;
    }
);

export default function StatsigProvider(props: Props): JSX.Element {
  let precomputedClient: PrecomputedEvaluationsInterface;
  let onDeviceClient: OnDeviceEvaluationsInterface;

  if ('client' in props) {
    precomputedClient = isPrecompoutedEvaluationsClient(props.client)
      ? props.client
      : NoopEvaluationsClient;
    onDeviceClient = !isPrecompoutedEvaluationsClient(props.client)
      ? props.client
      : NoopEvaluationsClient;
  } else {
    precomputedClient = props.precomputedClient;
    onDeviceClient = props.onDeviceClient;
  }

  const [version, setVersion] = useState(0);
  const clients = [precomputedClient, onDeviceClient];

  useEffect(() => {
    const onStatusChange = (data: StatsigClientEventData) => {
      if (data.event === 'status_change') {
        setVersion((v) => v + 1);
      }
    };

    clients.forEach((client) => {
      client.initialize().catch((error) => {
        Log.error('An error occurred during initialization', error);
      });

      client.on('status_change', onStatusChange);
    });

    return () => {
      clients.forEach((client) => {
        client.shutdown().catch((error) => {
          Log.error('An error occured during shutdown', error);
        });

        client.off('status_change', onStatusChange);
      });
    };
  }, clients);

  return (
    <StatsigContext.Provider value={{ onDeviceClient, precomputedClient }}>
      <View style={{ display: 'none' }} testID={`${version}`} />
      {shouldRender(precomputedClient) && shouldRender(onDeviceClient)
        ? props.children
        : null}
    </StatsigContext.Provider>
  );
}

function shouldRender(
  client: StatsigClientInterface | { isNoop: true },
): boolean {
  if ('isNoop' in client) {
    return true;
  }

  switch (client.loadingStatus) {
    case 'Network':
    case 'Bootstrap':
      return true;
    case 'Cache':
      return true;
    default:
      return false;
  }
}
