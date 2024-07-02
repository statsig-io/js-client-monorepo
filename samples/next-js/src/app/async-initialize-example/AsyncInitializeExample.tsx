'use client';

import { useContext, useMemo, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import {
  StatsigContext,
  StatsigProvider,
  useFeatureGate,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

function Content() {
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
    </div>
  );
}

function useAsyncClient(): { isLoading: boolean; client: StatsigClient } {
  const [isLoading, setIsLoading] = useState(true);

  const client = useMemo(() => {
    const instance = new StatsigClient(DEMO_CLIENT_KEY, { userID: 'a-user' });

    instance
      .initializeAsync()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
      });

    return instance;
  }, []);

  return { client, isLoading };
}

export default function AsyncInitializeExample(): JSX.Element {
  const { client, isLoading } = useAsyncClient();

  if (isLoading) {
    return <div>Statsig Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
