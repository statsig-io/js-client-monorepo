/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-floating-promises */
// <snippet>
import {
  DelayedNetworkEvaluationsDataProvider,
  LocalStorageCacheEvaluationsDataProvider,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };
const options = {
  dataProviders: [
    new LocalStorageCacheEvaluationsDataProvider(),
    DelayedNetworkEvaluationsDataProvider.create(),
  ]
};
const client = new PrecomputedEvaluationsClient(YOUR_CLIENT_KEY, user, options);

client.initialize();

console.log("Statsig Status: ", client.loadingStatus); // prints: "Statsig Status: Ready"

// </snippet>
}
