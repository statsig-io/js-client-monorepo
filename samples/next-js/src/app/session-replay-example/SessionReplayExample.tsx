'use client';

import { EventType } from '@rrweb/types';
import React, { useContext, useEffect } from 'react';

import {
  LogLevel,
  StatsigClientEvent,
  StatsigUser,
} from '@statsig/client-core';
import {
  StatsigContext,
  StatsigProvider,
  useClientBootstrapInit,
  useFeatureGate,
  useStatsigClient,
} from '@statsig/react-bindings';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

import { DEMO_CLIENT_KEY } from '../../utils/constants';
import { Logo } from './Logo';

/* eslint-disable no-console */

function printEventTypes(events: Record<string, unknown>[]) {
  const recordingEvents = events.filter(
    (event) => event['eventName'] === 'statsig::session_recording',
  );

  const eventTypes = recordingEvents.flatMap((event) => {
    if (
      event['metadata'] == null ||
      typeof event['metadata'] !== 'object' ||
      (event['metadata'] as Record<string, string>)['sliced_id'] != null
    ) {
      return [];
    }

    const metadata = event['metadata'] as Record<string, string>;
    const rrwebEvents = JSON.parse(metadata['rrweb_events']) as {
      type: EventType;
    }[];

    return rrwebEvents.map((event) => EventType[event.type]);
  });

  if (eventTypes.length > 0) {
    console.log(eventTypes);
  }
}

function Content() {
  const { client } = useStatsigClient();
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <Logo />
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
      <div style={{ color: 'blue', textDecoration: 'underline' }}>
        <a id="sub-page-link" href="/session-replay-example/sub-page">
          Sub Page
        </a>
      </div>
      <button
        id="leave-button"
        onClick={() => window.location.replace('https://statsig.com')}
      >
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
}): React.ReactElement {
  const client = useClientBootstrapInit(DEMO_CLIENT_KEY, user, values, {
    logLevel: LogLevel.Debug,
    plugins: [
      new StatsigSessionReplayPlugin({
        rrwebConfig: { blockClass: 'do-not-record' },
      }),
      new StatsigAutoCapturePlugin(),
    ],
  });

  useEffect(() => {
    const onLogsFlushed = (event: StatsigClientEvent<'logs_flushed'>) =>
      printEventTypes(event.events);

    client.on('logs_flushed', onLogsFlushed);
    return () => client.off('logs_flushed', onLogsFlushed);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
