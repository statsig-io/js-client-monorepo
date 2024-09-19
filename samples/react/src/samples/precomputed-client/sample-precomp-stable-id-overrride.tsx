/* eslint-disable no-console */
// <snippet>
import { StatsigClient, StatsigUser } from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export async function Sample(): Promise<void> {
// <snippet>
const userWithStableID: StatsigUser = {
  customIDs: {
    stableID: 'my-custom-stable-id', // <- Your Stable ID (Must have key "stableID")
  },
};

// Pass in your user object with a stableID
const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, userWithStableID);

// or, if you already have an initialized client, you can update the user instead
await myStatsigClient.updateUserAsync(userWithStableID);
// </snippet>

  myStatsigClient.initializeAsync().catch((err) => console.error(err));
}
