/* eslint-disable @typescript-eslint/no-unused-vars */
// <snippet>
import type { StatsigEvent } from '@statsig/client-core';

// </snippet>
import { myStatsigClient, myUser } from './sample-on-device-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const myEvent: StatsigEvent = {
  eventName: 'add_to_cart',
  value: 'SKU_12345',
  metadata: {
    price: '9.99',
    item_name: 'diet_coke_48_pack',
  },
}

myStatsigClient.logEvent(myEvent, myUser);
// </snippet>
}
