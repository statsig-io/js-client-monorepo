'use client';

import * as React from 'react';

import {
  StatsigOptions,
  StatsigProvider,
  StatsigUser,
  useClientBootstrapInit,
} from '@statsig/react-bindings';

export default function BootstrapClientSubProvider({
  user,
  values,
  children,
  clientKey,
  clientOptions,
}: {
  user: StatsigUser;
  values: string;
  children: React.ReactNode;
  clientKey: string;
  clientOptions?: StatsigOptions | null;
}): React.ReactElement {
  const client = useClientBootstrapInit(clientKey, user, values, clientOptions);
  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}
