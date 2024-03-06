import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';

export async function Sample(): Promise<void> {
  const user = { userID: 'a-user' };
  const client = new PrecomputedEvaluationsClient('YOUR_CLIENT_SDK_KEY');
  await client.initialize(user);

  if (client.checkGate('a_gate')) {
    // show new feature
  }
}
