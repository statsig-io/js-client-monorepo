import {
  StatsigLocalEvalClient,
  StatsigRemoteEvalClient,
  StatsigUser,
} from '@statsig/core';
import React, { useState } from 'react';
import StatsigContext from './StatsigContext';

type Props = {
  localEvalClient: StatsigLocalEvalClient;
  remoteEvalClient: StatsigRemoteEvalClient;
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
