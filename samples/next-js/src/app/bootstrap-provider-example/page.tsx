import * as React from 'react';

import { StatsigBootstrapProvider } from '@statsig/react-server';

import { DEMO_CLIENT_KEY } from '../../utils/constants';
import BootstrapExampleContent from '../bootstrap-provider-example/BootstrapExampleContent';
import { MY_STATSIG_SERVER_KEY } from '../statsig-demo/constants';

export default async function Index(): Promise<React.ReactElement> {
  return (
    <StatsigBootstrapProvider
      user={{
        userID: 'a-user',
        customIDs: {
          stableID: '123',
        },
        custom: {
          custom_field: 'custom_value',
        },
      }}
      clientKey={DEMO_CLIENT_KEY}
      serverKey={MY_STATSIG_SERVER_KEY}
    >
      <BootstrapExampleContent />
    </StatsigBootstrapProvider>
  );
}
