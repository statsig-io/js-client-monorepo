'use client';

import { useContext, useEffect, useMemo } from 'react';

import { StatsigClientEvent, StatsigUser } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigContext,
  StatsigProvider,
  useFeatureGate,
} from '@statsig/react-bindings';
import { SessionReplay } from '@statsig/session-replay';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

function useClientWithSessionReplay(
  sdkKey: string,
  user: StatsigUser,
  values: string,
): StatsigClient {
  const { client } = useMemo(() => {
    const client = new StatsigClient(sdkKey, user);
    client.dataAdapter.setData(values, user);
    client.initializeAsync().catch((err) => {
      console.error(err);
    });

    const replayer = new SessionReplay(client);
    return { client, replayer };
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
      <button id="a-button" onClick={() => console.log('clicked')}>
        Click Me
      </button>
    </div>
  );
}

export default function SessionReplayExample({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): JSX.Element {
  const client = useClientWithSessionReplay(DEMO_CLIENT_KEY, user, values);

  useEffect(() => {
    const onClientEvent = (event: StatsigClientEvent) =>
      console.log('StatsigClientEvent', event);
    client.on('*', onClientEvent);
    return () => client.off('*', onClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
