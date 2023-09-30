import React, { useEffect, useState } from 'react';

import {
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    client
      .initialize()
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        Log.error('An error occurred during initialization', error);
      });
  }, [client]);

  return (
    <StatsigContext.Provider value={{ client }}>
      {isReady ? children : null}
    </StatsigContext.Provider>
  );
}
