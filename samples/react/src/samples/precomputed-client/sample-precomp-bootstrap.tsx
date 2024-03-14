/* eslint-disable no-console */
import { DJB2 } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY } from '../../Contants';

// <snippet>
// Returns a JSON string from a local file or Statsig Server SDK.
function getStatsigBootstrapJson(): string {
  // •••
  // </snippet>

  const hash = DJB2('a_gate');

  return JSON.stringify({
    __note: 'Sample Response using the SDK Demo project',
    feature_gates: {
      [hash]: {
        name: hash,
        value: true,
        rule_id: '2QWhVkWdUEXR6Q3KYgV73O',
        id_type: 'userID',
        secondary_exposures: [],
      },
    },
    dynamic_configs: {},
    layer_configs: {},
    has_updates: true,
    time: 1705543730484,
    hash_used: 'djb2',
  });
  // <snippet>
}
// </snippet>

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };
// </snippet>

const myStatsigClient = new StatsigClient(
  STATSIG_CLIENT_KEY, 
  user,
);
const dataAdapter = myStatsigClient.getDataAdapter();
// <snippet>

// Pass the bootstrap values to the data adapter
dataAdapter.setData(getStatsigBootstrapJson(), user);

// Then finally call initializeSync
myStatsigClient.initializeSync();

const gate = myStatsigClient.getFeatureGate('a_gate');
console.log("a_gate source:", gate.details.reason) // prints: "a_gate source: Bootstrap"
// </snippet>
}
