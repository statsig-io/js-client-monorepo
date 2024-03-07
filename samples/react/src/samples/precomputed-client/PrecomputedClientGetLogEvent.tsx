/* eslint-disable @typescript-eslint/no-unused-vars */
import { myStatsigClient } from './PrecomputedClientInstance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
myStatsigClient.logEvent({
  eventName: 'add_to_cart',
  value: 'SKU_12345',
  metadata: {
    price: '9.99',
    item_name: 'diet_coke_48_pack',
  },
});
// </snippet>
}
