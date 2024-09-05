'use client';

import { type PropsWithChildren } from 'react';

import { StatsigUser } from '@statsig/js-client';
import {
  StatsigProvider,
  useClientBootstrapInit,
} from '@statsig/react-bindings';

type Props = PropsWithChildren & {
  readonly clientSdkKey: string;
  readonly user: StatsigUser;
  readonly values: string;
};

export default function BootstrappedStatsigProvider({
  clientSdkKey,
  user,
  values,
  children,
}: Props): JSX.Element {
  const client = useClientBootstrapInit(clientSdkKey, user, values, {
    networkConfig: {
      api: 'http://localhost:4200/statsig-demo/proxy', // Your Next.js server
    },
    disableStatsigEncoding: true,
  });

  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}
