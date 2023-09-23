import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
  StatsigUser,
} from '@statsig-client/core';
import React, { useEffect, useState } from 'react';
import StatsigContext from './StatsigContext';

type Props = {
  client: IStatsigLocalEvalClient | IStatsigRemoteEvalClient;
  user?: StatsigUser;
  children: React.ReactNode | React.ReactNode[];
};

export default function StatsigProvider({
  client,
  children,
}: Props): JSX.Element {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    client
      .initialize()
      .then(() => {
        setVersion((v) => v + 1);
      })
      .catch(() => {
        console.error('Err');
      });
    // client.initialize().catch((err) => {
    //   // eslint-disable-next-line no-console
    //   console.error(err);
    // });
  }, []);

  return (
    <StatsigContext.Provider value={{ client, version }}>
      {children}
    </StatsigContext.Provider>
  );
}
