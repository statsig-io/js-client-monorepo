/* eslint-disable @typescript-eslint/no-inferrable-types */
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
App();
}

// <snippet>
const myBootstrapValues: string = '...'; // Retrieved from a Statsig Server SDK

const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, {
  userID: 'a-user',
});

myStatsigClient.dataAdapter.setData(myBootstrapValues);
myStatsigClient.initializeSync();

function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>Reason: {gate.details.reason}</div>; // Reason: Bootstrap
}

function App() {
  return (
    <StatsigProvider client={myStatsigClient}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
