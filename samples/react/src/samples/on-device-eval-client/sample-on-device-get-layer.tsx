/* eslint-disable @typescript-eslint/no-unused-vars */
import { myStatsigClient, myUser } from './sample-on-device-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
// Values via getLayer

const layer = myStatsigClient.getLayer("user_promo_experiments", myUser);

const promoTitle = layer.getValue("title") ?? "Welcome to Statsig!";
const discount = layer.getValue("discount") ?? 0.1;
// </snippet>

viaGetExperiment()
}

// prettier-ignore
function viaGetExperiment() {
// <snippet>

// or, via getExperiment

const titleExperiment = myStatsigClient.getExperiment("new_user_promo_title", myUser);
const priceExperiment = myStatsigClient.getExperiment("new_user_promo_price", myUser);

const promoTitle = titleExperiment.value["title"] ?? "Welcome to Statsig!";
const discount = priceExperiment.value["discount"] ?? 0.1;
// </snippet>
}
