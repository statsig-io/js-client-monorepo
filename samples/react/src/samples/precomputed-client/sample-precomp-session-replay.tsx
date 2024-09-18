// <snippet>
import { StatsigClient } from '@statsig/js-client';
import { runStatsigSessionReplay } from '@statsig/session-replay';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, {
  userID: 'a-user',
});

runStatsigSessionReplay(myStatsigClient);

await myStatsigClient.initializeAsync();
// </snippet>
}
