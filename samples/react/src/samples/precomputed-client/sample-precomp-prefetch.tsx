/* eslint-disable no-console */
import { EvaluationsDataAdapter } from '@statsig/js-client';

import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {

const dataAdapter = new EvaluationsDataAdapter();
// <snippet>
const user = { userID: 'a-user' };

// Fetch the latest values for a given StatsigUser
await dataAdapter.prefetchDataForUser(user);

// Then, after the fetch completes, we can synchronously switch users
myStatsigClient.updateUserSync(user);
// </snippet>
}
