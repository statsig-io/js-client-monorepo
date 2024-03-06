/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-floating-promises */
import { DJB2 } from '@statsig/client-core';
// <snippet>
import {
  BootstrapEvaluationsDataProvider,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };

// Setup some Bootstrapped values
const bootstrapper = new BootstrapEvaluationsDataProvider();
bootstrapper.addDataForUser(YOUR_CLIENT_KEY, getStatsigJson(), user)

const options = {
  dataProviders: [bootstrapper]
};
const client = new PrecomputedEvaluationsClient(YOUR_CLIENT_KEY, user, options);

client.initialize();

console.log("Statsig Status: ", client.loadingStatus); // prints: "Statsig Status: Ready"

const gate = client.getFeatureGate('a_gate');
console.log("a_gate source:", gate.source) // prints: "a_gate source: Bootstrap"

// </snippet>
}

function getStatsigJson(): string {
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
}
