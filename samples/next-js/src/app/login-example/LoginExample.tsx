'use client';

import { useMemo } from 'react';

import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider,
  useFeatureGate,
  useStatsigClient,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

if (typeof window !== 'undefined') {
  const orig = window.fetch;
  window.fetch = async (url, args) => {
    console.log('forcing network delay...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return orig(url, args);
  };
}

function Content() {
  const { client } = useStatsigClient();
  const { value, details } = useFeatureGate('partial_gate');

  const handleLogin = () => {
    client
      .updateUserAsync({ userID: 'updated-user' })
      .catch((err) => console.log(err));
  };

  return (
    <div style={{ padding: 16 }}>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
      <button onClick={() => handleLogin()}>Update User</button>
    </div>
  );
}

export default function LoginExample(): JSX.Element {
  const client = useMemo(() => {
    const instance = new StatsigClient(DEMO_CLIENT_KEY, {
      userID: 'initial-user',
    });

    instance.initializeAsync().catch((err) => console.error(err));
    return instance;
  }, []);

  return (
    <StatsigProvider
      client={client}
      loadingComponent={<div style={{ padding: 16 }}>Statsig Loading...</div>}
    >
      <Content />
    </StatsigProvider>
  );
}
