/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-console */
// <snippet>
import { EvaluationsDataAdapter, StatsigClient } from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
// Creating your own instance during startup
const myDataAdapter = new EvaluationsDataAdapter();
const myStatsigClient = new StatsigClient(
  YOUR_CLIENT_KEY, 
  { userID: 'a-user' },
  { dataAdapter: myDataAdapter } // <- Pass the data adapter via StatsigOptions
);

// Or, get the adapter at some later point
const dataAdapter = myStatsigClient.getDataAdapter();
// </snippet>
}
