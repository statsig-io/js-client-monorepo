/* eslint-disable @typescript-eslint/no-inferrable-types */
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
App();
}

// <snippet>
const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, {
  userID: 'a-user',
});

myStatsigClient.initializeSync();

function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>Reason: {gate.details.reason}</div>; // Reason: Cache or NoValues
}

function App() {
  return (
    <StatsigProvider client={myStatsigClient}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
