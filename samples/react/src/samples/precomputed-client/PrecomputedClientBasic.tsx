// <snippet>
import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };
const client = new PrecomputedEvaluationsClient(YOUR_CLIENT_KEY, user);

client.initializeSync();

if (client.checkGate('a_gate')) {
  // show new  feature
}

// </snippet>
}
