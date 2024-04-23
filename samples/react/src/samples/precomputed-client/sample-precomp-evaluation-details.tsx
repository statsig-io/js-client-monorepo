/* eslint-disable @typescript-eslint/no-unused-vars */
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const gate = myStatsigClient.getFeatureGate('a_gate');
console.log(gate.details);
// ⮑ { "reason": "Cache:Recognized", "lcut": 1713837126636, "receivedAt": 1713838137598 } 

const config = myStatsigClient.getDynamicConfig('a_config');
console.log(config.details);
// ⮑ { "reason": "Cache:Unrecognized", "lcut": 1713837126636, "receivedAt": 1713838137598 } 

// Note: Only "reason" is different as "lcut" and "receivedAt" relate to all values
// </snippet>
}
