/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-console */
import {
  AnyStatsigOptions,
  DataAdapterResult,
  EvaluationsDataAdapter,
  StatsigUser,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';
import { myStatsigClient } from './sample-precomp-instance';

class MyCustomEvalDataAdapter implements EvaluationsDataAdapter {
  attach(_sdkKey: string, _options: AnyStatsigOptions | null) {
    //
  }
  __primeInMemoryCache(_cache: Record<string, DataAdapterResult>) {
    //
  }
  getDataSync(_user: StatsigUser): DataAdapterResult | null {
    return null;
  }
  getDataAsync(_current: DataAdapterResult | null, _user: StatsigUser) {
    return Promise.resolve(null);
  }
  prefetchData(_user: StatsigUser) {
    return Promise.resolve();
  }
  setData(data: string) {
    //
  }
  setDataLegacy(data: string, user: StatsigUser) {
    //
  }
}

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
const myDataAdapter = new MyCustomEvalDataAdapter();
const myStatsigClient = new StatsigClient(
  YOUR_CLIENT_KEY,
  { userID: 'a-user' },
  { dataAdapter: myDataAdapter }, // <- Pass the data adapter in via StatsigOptions
);
// </snippet>
}
