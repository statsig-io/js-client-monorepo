/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
import { useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App);
}

// <snippet>
function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>Reason: {gate.details.reason}</div>; // Reason: Cache or NoValues
}

function App() {
  const [myStatsigClient] = useState(() => {
    const client = new StatsigClient(YOUR_CLIENT_KEY, {
      userID: 'a-user',
    });

    // 🔥 Init from Cache
    // 🔥 Will have 'NoValues' for first time users
    client.initializeSync();

    return client;
  });

  return (
    <StatsigProvider client={myStatsigClient}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
