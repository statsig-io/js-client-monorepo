'use client';

import { useContext, useEffect, useMemo } from 'react';
import { StatsigUser } from 'statsig-node';

import { StatsigClientEventData } from '@statsig/client-core';
import { EvaluationsDataAdapter, StatsigClient } from '@statsig/js-client';
import {
  StatsigContext,
  StatsigProvider,
  useGate,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function useBootstrappedClient(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): StatsigClient {
  const client = useMemo(() => {
    const dataAdapter = new EvaluationsDataAdapter();
    const client = new StatsigClient(sdkKey, user, {
      dataAdapter,
    });
    dataAdapter.setDataForUser(user, values);
    client.initializeSync();
    return client;
  }, [sdkKey, user, values]);

  return client;
}

function Content() {
  const { value, details } = useGate('a_gate');
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
    const onClientEvent = (data: StatsigClientEventData) => console.log(data);
    client.on('*', onClientEvent);
    return () => client.off('*', onClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
