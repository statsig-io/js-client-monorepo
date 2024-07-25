'use client';

import { useMemo } from 'react';

import { LogLevel } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { LocalOverrideAdapter } from '@statsig/js-local-overrides';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function useClientWithOverrides(): StatsigClient {
  const { client } = useMemo(() => {
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

    client.initializeSync();

    return { client };
  }, []);

  return client;
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

export default function OverrideAdapterExample(): JSX.Element {
  const client = useClientWithOverrides();

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
