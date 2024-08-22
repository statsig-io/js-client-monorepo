'use client';

import { useContext, useEffect } from 'react';
import { StatsigUser } from 'statsig-node';

import { AnyStatsigClientEvent, LogLevel } from '@statsig/client-core';
import {
  StatsigContext,
  StatsigProvider,
  useClientBootstrapInit,
  useFeatureGate,
  useStatsigClient,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

function Content() {
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);
  const { client } = useStatsigClient();

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <button onClick={() => client.logEvent('my_event')}>Log Event</button>
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
  const { client } = useClientBootstrapInit(DEMO_CLIENT_KEY, user, values, {
    logLevel: LogLevel.Debug,
  });

  useEffect(() => {
    const onAnyClientEvent = (event: AnyStatsigClientEvent) =>
      console.log(event);
    client.on('*', onAnyClientEvent);
    return () => client.off('*', onAnyClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
