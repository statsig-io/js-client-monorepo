'use client';

import * as React from 'react';
import { useState } from 'react';

import { Log, LogLevel } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { LocalOverrideAdapter } from '@statsig/js-local-overrides';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function useClientWithOverrides(): {
  client: StatsigClient;
  isLoading: boolean;
} {
  const [isLoading, setIsLoading] = useState(true);

  const [client] = useState(() => {
    const overrideAdapter = new LocalOverrideAdapter();
    overrideAdapter.overrideGate('gate_a', false);
    overrideAdapter.overrideGate('gate_b', true);

    const client = new StatsigClient(
      DEMO_CLIENT_KEY,
      { userID: 'a-user' },
      {
        logLevel: LogLevel.Debug,
        overrideAdapter,
      },
    );

    client
      .initializeAsync()
      .catch(Log.error)
      .finally(() => setIsLoading(false));

    return client;
  });

  return { isLoading, client };
}

function Content() {
  const gateA = useFeatureGate('gate_a');
  const gateB = useFeatureGate('gate_b');

  return (
    <div style={{ padding: 16 }}>
      <div>
        gate_a: {gateA.value ? 'Passing' : 'Failing'} ({gateA.details.reason})
      </div>
      <div>
        gate_b: {gateB.value ? 'Passing' : 'Failing'} ({gateB.details.reason})
      </div>
    </div>
  );
}

export default function OverrideAdapterExample(): React.ReactElement {
  const { client, isLoading } = useClientWithOverrides();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
