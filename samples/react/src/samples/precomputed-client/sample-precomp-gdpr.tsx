/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
// start the client without storage or logging
const client = new StatsigClient(YOUR_CLIENT_KEY, {}, {
  disableLogging: true,
  disableStorage: true
});
client.initializeSync();

// then, once permissions have been granted
client.updateRuntimeOptions({disableLogging: false, disableStorage: false})

// </snippet>
}
