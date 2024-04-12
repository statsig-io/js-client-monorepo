/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-console */
import {
  StatsigOnDeviceEvalClient,
  StatsigSpecsDataAdapter,
} from '@statsig/js-on-device-eval-client';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';
import { myStatsigClient } from './sample-on-device-instance';

class MyCustomSpecsDataAdapter extends StatsigSpecsDataAdapter {}

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
// Get the adapter
const dataAdapter = myStatsigClient.dataAdapter;
// </snippet>

return Promise.resolve();
}
// prettier-ignore
function foo() {
// <snippet>

// Or, use your own custom implementation
const myDataAdapter = new MyCustomSpecsDataAdapter();
const myStatsigClient = new StatsigOnDeviceEvalClient(
  YOUR_CLIENT_KEY,
  { dataAdapter: myDataAdapter }, // <- Pass the data adapter in via StatsigOptions
);
// </snippet>
}
