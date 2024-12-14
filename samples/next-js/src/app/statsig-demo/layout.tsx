import * as React from 'react';

import BootstrappedStatsigProvider from './BootstrappedStatsigProvider';
import { getStatsigValues } from './StatsigHelpers';
import { MY_STATSIG_CLIENT_KEY } from './constants';

export default async function StatsigDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const user = { userID: 'my-user' };
  const values = await getStatsigValues(user);

  return (
    <BootstrappedStatsigProvider
      clientSdkKey={MY_STATSIG_CLIENT_KEY}
      values={values}
      user={user}
    >
      {children}
    </BootstrappedStatsigProvider>
  );
}
