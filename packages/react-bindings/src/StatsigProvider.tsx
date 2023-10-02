import React, { useEffect, useState } from 'react';

import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigLoadingStatus,
} from '@sigstat/core';

import StatsigContext from './StatsigContext';

type Props = {
  client: OnDeviceEvaluationsInterface | PrecomputedEvaluationsInterface;
  children: React.ReactNode | React.ReactNode[];
};

export default function StatsigProvider({
  client,
  children,
}: Props): JSX.Element {
  const [loadingStatus, setLoadingStatus] = useState(client.loadingStatus);

  useEffect(() => {
    client.initialize().catch((error) => {
      Log.error('An error occurred during initialization', error);
    });

    const onStatusChange = (data: Record<string, unknown>) => {
      setLoadingStatus(data['loadingStatus'] as StatsigLoadingStatus);
    };
    client.on('status_change', onStatusChange);

    return () => {
      client.shutdown().catch((error) => {
        Log.error('An error occured during shutdown', error);
      });

      client.off('status_change', onStatusChange);
    };
  }, [client]);

  return (
    <StatsigContext.Provider value={{ client }}>
      {loadingStatus === 'Network' || loadingStatus === 'Cache'
        ? children
        : null}
    </StatsigContext.Provider>
  );
}
