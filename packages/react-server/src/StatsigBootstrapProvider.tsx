import { JSX, ReactNode } from 'react';
import Statsig, { StatsigUser as StatsigNodeUser } from 'statsig-node';

import { StatsigUser } from '@statsig/react-bindings';

import BootstrapClientSubProvider from './BootstrapClientSubProvider';

const statsigInitialization: Record<string, Promise<any> | undefined> = {};

export default async function StatsigBootstrapProvider({
  children,
  user,
  clientKey,
  serverKey,
}: {
  user: StatsigUser;
  children: ReactNode;
  clientKey: string;
  serverKey: string;
}): Promise<JSX.Element> {
  if (!statsigInitialization[serverKey]) {
    statsigInitialization[serverKey] = Statsig.initialize(serverKey);
  }
  await statsigInitialization[serverKey];
  const values = JSON.stringify(
    Statsig.getClientInitializeResponse(user as StatsigNodeUser, clientKey, {
      hash: 'djb2',
    }),
  );

  return (
    <BootstrapClientSubProvider
      user={user}
      values={values}
      clientKey={clientKey}
    >
      {children}
    </BootstrapClientSubProvider>
  );
}
