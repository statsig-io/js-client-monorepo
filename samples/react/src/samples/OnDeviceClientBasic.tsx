// <snippet>
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };
const client = new StatsigOnDeviceEvalClient(YOUR_CLIENT_KEY);

await client.initializeAsync();

if (client.checkGate('a_gate', user)) {
  // show new  feature
}

// </snippet>
}
