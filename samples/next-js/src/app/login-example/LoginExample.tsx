'use client';

import { useMemo, useState } from 'react';

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

function Content({
  setIsLoading,
}: {
  setIsLoading: (isLoading: boolean) => void;
}) {
  const { client } = useStatsigClient();
  const { value, details } = useFeatureGate('partial_gate');

  const handleLogin = () => {
    setIsLoading(true);

    const updatedUser = { userID: 'updated-user' };

    client.dataAdapter
      .prefetchData(updatedUser)
      .catch((err) => console.log(err))
      .finally(() => {
        client.updateUserSync(updatedUser);
        setIsLoading(false);
      });
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

function useAsyncClient(setIsLoading: (isLoading: boolean) => void): {
  client: StatsigClient;
} {
  const client = useMemo(() => {
    const instance = new StatsigClient(DEMO_CLIENT_KEY, {
      userID: 'initial-user',
    });

    instance
      .initializeAsync()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
      });

    return instance;
  }, [setIsLoading]);

  return { client };
}

export default function LoginExample(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const { client } = useAsyncClient(setIsLoading);

  if (isLoading) {
    return <div style={{ padding: 16 }}>Statsig Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content setIsLoading={setIsLoading} />
    </StatsigProvider>
  );
}
