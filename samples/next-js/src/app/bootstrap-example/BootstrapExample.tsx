'use client';

import { useContext, useEffect, useMemo } from 'react';
import { StatsigUser } from 'statsig-node';

import { StatsigClientEvent } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigContext,
  StatsigProvider,
  useFeatureGate,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function useBootstrappedClient(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): StatsigClient {
  const client = useMemo(() => {
    const client = new StatsigClient(sdkKey, user);
    client.dataAdapter.setData(values, user);

    client.initializeSync();
    return client;
  }, [sdkKey, user, values]);

  return client;
}

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

export default function BootstrapExample({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): JSX.Element {
  const client = useBootstrappedClient(DEMO_CLIENT_KEY, user, values);

  useEffect(() => {
    // eslint-disable-next-line no-console
    const onClientEvent = (event: StatsigClientEvent) => console.log(event);
    client.on('*', onClientEvent);
    client.on('logs_flushed', (event) => {
      event.events.unshift();
    });
    return () => client.off('*', onClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
