/* eslint-disable no-console */
// <snippet>
import { StatsigClient, StatsigUser } from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// <snippet>
const user: StatsigUser = {
  customIDs: {
    stableID: 'my-custom-stable-id', // <- Your Stable ID (Must have key "stableID")
  },
};

// Pass in your user object with a stableID
const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, user);
// </snippet>

myStatsigClient.initializeAsync().catch((err) => console.error(err));
