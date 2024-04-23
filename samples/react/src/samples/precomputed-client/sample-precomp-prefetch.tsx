/* eslint-disable no-console */
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {

// <snippet>
const user = { userID: 'my-other-user' };

// Fetch the latest values for a given StatsigUser
await myStatsigClient.dataAdapter.prefetchData(user);

// or, if you just want to do it optimistically
myStatsigClient.dataAdapter
    .prefetchData(user)
    .catch((err) => console.warn("Failed to prefetch", err));

// Then, at some later time, we can synchronously switch users
myStatsigClient.updateUserSync(user);

const gate = myStatsigClient.getFeatureGate('a_gate');
console.log(`a_gate`, gate.value, gate.details.reason); // outputs: a_gate, true, Prefetch:Recognized
// </snippet>
}
