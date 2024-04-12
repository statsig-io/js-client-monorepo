// <snippet>
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const myStatsigClient = new StatsigOnDeviceEvalClient(
  YOUR_CLIENT_KEY, 
  { environment: {tier: 'development'} }
);

// initialize immediately from cache values
myStatsigClient.initializeSync();

// or, initialize and wait for the latest values
await myStatsigClient.initializeAsync();
// </snippet>
}
