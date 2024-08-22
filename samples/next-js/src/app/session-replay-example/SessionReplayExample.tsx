'use client';

import { useContext, useEffect } from 'react';

import {
  AnyStatsigClientEvent,
  LogLevel,
  StatsigUser,
} from '@statsig/client-core';
import {
  StatsigContext,
  StatsigProvider,
  useClientBootstrapInit,
  useFeatureGate,
  useStatsigClient,
} from '@statsig/react-bindings';
import { runStatsigSessionReplay } from '@statsig/session-replay';
import { runStatsigAutoCapture } from '@statsig/web-analytics';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

function Content() {
  const { client } = useStatsigClient();
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
      <button
        id="a-button"
        onClick={() => {
          client.logEvent({ eventName: 'clicked_button_a' });
          console.log('click');
        }}
      >
        Click Me
      </button>
      <p className="do-not-record">Secret: 123-12-1234</p>
      <button onClick={() => window.location.replace('https://statsig.com')}>
        Leave
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
  const { client } = useClientBootstrapInit(DEMO_CLIENT_KEY, user, values, {
    logLevel: LogLevel.Debug,
  });

  useEffect(() => {
    runStatsigSessionReplay(client, {
      rrwebConfig: { blockClass: 'do-not-record' },
    });
    runStatsigAutoCapture(client);

    const onClientEvent = (event: AnyStatsigClientEvent) => {
      console.log('StatsigClientEvent', event);
    };

    client.on('*', onClientEvent);
    return () => client.off('*', onClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
