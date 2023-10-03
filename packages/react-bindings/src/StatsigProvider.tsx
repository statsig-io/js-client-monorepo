import { ReactNode, useEffect, useState } from 'react';

import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigClientEventData,
} from '@sigstat/core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';
import { isRemoteEvaluationClient } from './RemoteVsLocalUtil';
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
    precomputedClient = isRemoteEvaluationClient(props.client)
      ? props.client
      : NoopEvaluationsClient;
    onDeviceClient = !isRemoteEvaluationClient(props.client)
      ? props.client
      : NoopEvaluationsClient;
  } else {
    precomputedClient = props.precomputedClient;
    onDeviceClient = props.onDeviceClient;
  }

  const [loadingStatus, setLoadingStatus] = useState(
    precomputedClient.loadingStatus,
  );

  useEffect(() => {
    precomputedClient.initialize().catch((error) => {
      Log.error('An error occurred during initialization', error);
    });

    const onStatusChange = (data: StatsigClientEventData) => {
      if (data.event === 'status_change') {
        setLoadingStatus(data.loadingStatus);
      }
    };
    precomputedClient.on('status_change', onStatusChange);

    return () => {
      precomputedClient.shutdown().catch((error) => {
        Log.error('An error occured during shutdown', error);
      });

      precomputedClient.off('status_change', onStatusChange);
    };
  }, [precomputedClient]);

  return (
    <StatsigContext.Provider value={{ onDeviceClient, precomputedClient }}>
      {loadingStatus === 'Network' ||
      loadingStatus === 'Cache' ||
      loadingStatus === 'Bootstrap'
        ? props.children
        : null}
    </StatsigContext.Provider>
  );
}
