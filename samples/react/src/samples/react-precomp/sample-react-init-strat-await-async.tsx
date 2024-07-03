/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
import { useEffect, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App);
}

// <snippet>
const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, {
  userID: 'a-user',
});

function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>Reason: {gate.details.reason}</div>; // Reason: Network or NetworkNotModified
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    myStatsigClient
      .initializeAsync()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => console.log(err));
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProvider client={myStatsigClient}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
