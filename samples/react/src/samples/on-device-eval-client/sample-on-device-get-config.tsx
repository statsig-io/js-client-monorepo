/* eslint-disable @typescript-eslint/no-unused-vars */
import { myStatsigClient, myUser } from './sample-on-device-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const dynamicConfig = myStatsigClient.getDynamicConfig("awesome_product_details", myUser);
const itemName = dynamicConfig.value["product_name"] ?? "Some Fallback";
const price = dynamicConfig.value["price"] ?? 10.0;

if (dynamicConfig.value["is_discount_enabled"] === true) {
  // apply some discount logic
}
// </snippet>
}
