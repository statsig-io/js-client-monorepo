/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-console */
// <snippet>
import { EvaluationsDataAdapter } from '@statsig/client-core';
import {
  StatsigClient,
  StatsigEvaluationsDataAdapter,
} from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';
import { myStatsigClient } from './sample-precomp-instance';

class MyCustomEvalDataAdapter extends StatsigEvaluationsDataAdapter {}

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>

// Get the adapter
const dataAdapter = myStatsigClient.dataAdapter;

return Promise.resolve();
}

function foo() {
  // Creating your own instance during startup
  const myDataAdapter = new MyCustomEvalDataAdapter();
  const myStatsigClient = new StatsigClient(
    YOUR_CLIENT_KEY,
    { userID: 'a-user' },
    { dataAdapter: myDataAdapter }, // <- Pass the data adapter via StatsigOptions
  );

  // Or, get the adapter at some later point
  // </snippet>
}
