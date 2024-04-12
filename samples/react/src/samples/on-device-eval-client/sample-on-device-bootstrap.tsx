/* eslint-disable no-console */
import { DJB2 } from '@statsig/client-core';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

import { STATSIG_CLIENT_KEY } from '../../Contants';

// <snippet>
// Returns a JSON string from a local file.
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
const myUser = { userID: 'a-user' };
// </snippet>

const myStatsigClient = new StatsigOnDeviceEvalClient(
  STATSIG_CLIENT_KEY, 
);
const dataAdapter = myStatsigClient.dataAdapter;
// <snippet>

// Pass the bootstrap values to the data adapter
dataAdapter.setData(getStatsigBootstrapJson());

// Then finally call initializeSync
myStatsigClient.initializeSync();

const gate = myStatsigClient.getFeatureGate('a_gate', myUser);
console.log("a_gate source:", gate.details.reason) // prints: "a_gate source: Bootstrap"
// </snippet>
}
