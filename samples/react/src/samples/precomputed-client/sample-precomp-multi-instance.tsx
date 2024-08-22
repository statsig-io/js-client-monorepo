// <snippet>
import { StatsigClient } from '@statsig/js-client';

// </snippet>
import {
  STATSIG_CLIENT_KEY_WITH_DCS as SOME_OTHER_KEY,
  STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY,
} from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const mainStatsigClient = new StatsigClient(
  YOUR_CLIENT_KEY, 
  { userID: 'a-user' },
);

const secondaryStatsigClient = new StatsigClient(
  SOME_OTHER_KEY, 
  { userID: 'some-other-user' },
);

await Promise.all([
  mainStatsigClient.initializeAsync(),
  secondaryStatsigClient.initializeAsync()
]);

if (mainStatsigClient.checkGate('a_gate')) {
  // do something because a_gate passes
}

if (secondaryStatsigClient.checkGate('some_other_gate')) {
  // do something beacuse some_other_gate passes
}
// </snippet>
}
