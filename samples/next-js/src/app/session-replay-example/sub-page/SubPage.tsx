'use client';

import { EventType } from '@rrweb/types';
import { useEffect } from 'react';

import { LogLevel, StatsigClientEvent } from '@statsig/client-core';
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-bindings';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

import { DEMO_CLIENT_KEY } from '../../../utils/constants';

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

export default function SubPage(): React.ReactElement {
  const { client } = useClientAsyncInit(
    DEMO_CLIENT_KEY,
    {},
    {
      logLevel: LogLevel.Debug,
      plugins: [
        new StatsigSessionReplayPlugin({
          rrwebConfig: { blockClass: 'do-not-record' },
        }),
        new StatsigAutoCapturePlugin(),
      ],
      disableCompression: true,
    },
  );

  useEffect(() => {
    const onLogsFlushed = (event: StatsigClientEvent<'logs_flushed'>) =>
      printEventTypes(event.events);

    client.on('logs_flushed', onLogsFlushed);
    return () => client.off('logs_flushed', onLogsFlushed);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <div>Sub Page!</div>
    </StatsigProvider>
  );
}
