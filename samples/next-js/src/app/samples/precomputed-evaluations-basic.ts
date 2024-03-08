import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';

export async function Sample(): Promise<void> {
  const user = { userID: 'a-user' };
  const client = new PrecomputedEvaluationsClient('YOUR_CLIENT_SDK_KEY', user);
  client.initialize();

  if (client.checkGate('a_gate')) {
    // show new feature
  }
}
