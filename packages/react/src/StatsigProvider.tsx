import {
  IStatsigOnDeviceEvalClient,
  IStatsigRemoteServerEvalClient,
} from '@statsig-client/core';
import React, { useEffect, useState } from 'react';
import StatsigContext from './StatsigContext';

type Props = {
  client: IStatsigOnDeviceEvalClient | IStatsigRemoteServerEvalClient;
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
        // eslint-disable-next-line no-console
        console.error(
          '[Statsig] An error occurred during initialization',
          error,
        );
      });
  }, [client]);

  return (
    <StatsigContext.Provider value={{ client }}>
      {isReady ? children : null}
    </StatsigContext.Provider>
  );
}
