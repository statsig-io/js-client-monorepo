'use client';

import { type PropsWithChildren, useMemo } from 'react';

import {
  StatsigClient,
  type StatsigOptions,
  StatsigUser,
} from '@statsig/js-client';
import { StatsigProvider } from '@statsig/react-bindings';

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
  const client = useMemo(() => {
    const options: StatsigOptions = {
      networkConfig: {
        api: 'http://localhost:4200/statsig-demo/proxy', // Your Next.js server
      },
      disableStatsigEncoding: true,
      disableCompression: true,
    };

    const client = new StatsigClient(clientSdkKey, user, options);
    client.dataAdapter.setData(values);
    client.initializeSync();
    return client;
  }, [clientSdkKey, user, values]);

  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}
