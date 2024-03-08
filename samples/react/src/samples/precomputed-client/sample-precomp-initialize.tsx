// <snippet>
import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const myStatsigClient = new PrecomputedEvaluationsClient(
  YOUR_CLIENT_KEY, 
  { userID: 'a-user' },
  { environment: { tier: 'development' } } // (optional) Configure SDK via StatsigOptions here
);

// initialize immediately from cache values
myStatsigClient.initializeSync();

// or, initialize and wait for the latest values
await myStatsigClient.initializeAsync();
// </snippet>
}
