import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
  StatsigUser,
} from '@statsig-client/core';
import React, { useState } from 'react';
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
  const [version] = useState(0);

  return (
    <StatsigContext.Provider value={{ client, version }}>
      {children}
    </StatsigContext.Provider>
  );
}
