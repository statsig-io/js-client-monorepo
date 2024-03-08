// <snippet>
import { OnDeviceEvaluationsClient } from '@statsig/on-device-evaluations';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };
const client = new OnDeviceEvaluationsClient(YOUR_CLIENT_KEY);

client.initializeSync();

if (client.checkGate('a_gate', user)) {
  // show new  feature
}

// </snippet>
}
