/* eslint-disable no-console */
// <snippet>
import { StatsigClient } from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// <snippet>
export async function transform(input: string): Promise<string> {
  const client = new StatsigClient(
    YOUR_CLIENT_KEY,
    { userID: 'a-user' },
    {
      networkConfig: {
        preventAllNetworkTraffic:
          typeof process !== 'undefined' && process.env['NODE_ENV'] === 'test',
      },
    },
  );
  await client.initializeAsync();

  if (client.checkGate('a_gate')) {
    input = 'transformed';
  }

  const experiment = client.getExperiment('an_experiment');

  input += '-' + experiment.get('my_param', 'fallback');

  await client.shutdown();

  return input;
}

// </snippet>

// prettier-ignore
export default async function Sample(): Promise<void> {
    console.log(transform);
}
