// <snippet>
import { StatsigClient } from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const myStatsigClient = new StatsigClient(
  YOUR_CLIENT_KEY, 
  { userID: 'a-user' },
  { environment: { tier: 'development' } } // (optional) Configure SDK via StatsigOptions here
);

// initialize and wait for the latest values
await myStatsigClient.initializeAsync();
// </snippet>
}
