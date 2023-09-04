import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
  StatsigUser,
} from '@statsig/core';
import React, { useState } from 'react';
import StatsigContext from './StatsigContext';

type Props = {
  localEvalClient: IStatsigLocalEvalClient;
  remoteEvalClient: IStatsigRemoteEvalClient;
  user?: StatsigUser;
  children: React.ReactNode | React.ReactNode[];
};

export default function StatsigProvider({
  localEvalClient,
  remoteEvalClient,
  children,
}: Props): JSX.Element {
  const [version] = useState(0);

  return (
    <StatsigContext.Provider
      value={{ localEvalClient, remoteEvalClient, version }}
    >
      {children}
    </StatsigContext.Provider>
  );
}
