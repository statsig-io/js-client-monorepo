import * as React from 'react';

import { StatsigBootstrapProvider } from '@statsig/next';

import { DEMO_CLIENT_KEY } from '../../utils/constants';
import BootstrapExampleContent from '../bootstrap-provider-example/BootstrapExampleContent';
import { MY_STATSIG_SERVER_KEY } from '../statsig-demo/constants';

export default async function Index(): Promise<React.ReactElement> {
  return (
    <StatsigBootstrapProvider
      user={{
        userID: 'a-user',
      }}
      clientKey={DEMO_CLIENT_KEY}
      serverKey={MY_STATSIG_SERVER_KEY}
    >
      <BootstrapExampleContent />
    </StatsigBootstrapProvider>
  );
}
