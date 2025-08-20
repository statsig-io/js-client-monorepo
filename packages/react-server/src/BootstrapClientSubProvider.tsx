'use client';

import * as React from 'react';

import {
  StatsigProvider,
  StatsigUser,
  useClientBootstrapInit,
} from '@statsig/react-bindings';

export default function BootstrapClientSubProvider({
  user,
  values,
  children,
  clientKey,
}: {
  user: StatsigUser;
  values: string;
  children: React.ReactNode;
  clientKey: string;
}): React.ReactElement {
  const client = useClientBootstrapInit(clientKey, user, values);

  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}
