/* eslint-disable no-console */
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {

// <snippet>
const user = { userID: 'a-user' };

// Fetch the latest values for a given StatsigUser
await myStatsigClient.dataAdapter.prefetchData(user);

// Then, after the fetch completes, we can synchronously switch users
myStatsigClient.updateUserSync(user);
// </snippet>
}
