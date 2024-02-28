import { ReactNode, useEffect, useState } from 'react';

import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigClientEventData,
  StatsigClientInterface,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isPrecomputedEvaluationsClient } from './OnDeviceVsPrecomputedUtils';
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
    precomputedClient = isPrecomputedEvaluationsClient(props.client)
      ? props.client
      : NoopEvaluationsClient;
    onDeviceClient = !isPrecomputedEvaluationsClient(props.client)
      ? props.client
      : NoopEvaluationsClient;
  } else {
    precomputedClient = props.precomputedClient;
    onDeviceClient = props.onDeviceClient;
  }

  const [renderVersion, setRenderVersion] = useState(0);
  const clients = [precomputedClient, onDeviceClient];

  useEffect(() => {
    const onStatusChange = (data: StatsigClientEventData) => {
      if (data.event === 'status_change') {
        setRenderVersion((v) => v + 1);
      }
    };

    clients.forEach((client) => {
      client.on('status_change', onStatusChange);

      client.initialize().catch((error) => {
        Log.error('An error occurred during initialization', error);
      });
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
    <StatsigContext.Provider
      value={{ renderVersion, onDeviceClient, precomputedClient }}
    >
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
    case 'Ready':
      return true;
    default:
      return false;
  }
}
