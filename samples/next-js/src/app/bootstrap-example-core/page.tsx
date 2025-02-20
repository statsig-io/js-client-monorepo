import * as React from 'react';

import { StatsigUser as StatsigUserCore } from '@statsig/statsig-node-core';

import { getStatsigValues } from '../../utils/statsig-server-core';
import BootstrapExample from './BootstrapExample';

export default async function Index(): Promise<React.ReactElement> {
  const user = { userID: 'a-user', customIDs: {} };
  const coreUser = new StatsigUserCore(user);
  const values = await getStatsigValues(coreUser);

  return <BootstrapExample user={user} values={values} />;
}
