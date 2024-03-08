/* eslint-disable no-console */
import { DJB2 } from '@statsig/client-core';
// <snippet>
import { EvaluationsDataAdapter } from '@statsig/precomputed-evaluations';

// </snippet>
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
const dataAdapter = new EvaluationsDataAdapter();

// <snippet>

const user = { userID: 'a-user' }

// Pass the bootstrap values to the data adapter
dataAdapter.setDataForUser(user, getStatsigBootstrapJson());

// Then finally call initializeSync
myStatsigClient.initializeSync();

const gate = myStatsigClient.getFeatureGate('a_gate');
console.log("a_gate source:", gate.details.reason) // prints: "a_gate source: Bootstrap"
// </snippet>
}

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
