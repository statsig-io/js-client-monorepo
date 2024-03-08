/* eslint-disable no-console */
// <snippet>
import { EvaluationsDataAdapter } from '@statsig/precomputed-evaluations';

// </snippet>
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {

const dataAdapter = new EvaluationsDataAdapter();
// <snippet>

const user = { userID: 'a-user' };

// Fetch the latest values for a given StatsigUser
await dataAdapter.getDataAsync(null, user);

// Then, after the update completes, we can synchronously switch users
myStatsigClient.updateUserSync(user);
// </snippet>
}
