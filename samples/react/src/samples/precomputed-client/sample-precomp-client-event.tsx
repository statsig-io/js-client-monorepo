/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-unused-vars */
// <snippet>
import type {
  AnyStatsigClientEvent,
  StatsigClientEvent,
  StatsigClientEventCallback,
} from '@statsig/client-core';

// </snippet>
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const onAnyClientEvent = (event: AnyStatsigClientEvent) => {
  console.log("Any Client Event", event);
};

const onLogsFlushed = (event: StatsigClientEvent<'logs_flushed'>) => {
  console.log("Logs", event.events);
};

// subscribe to an individual StatsigClientEvent
myStatsigClient.on('logs_flushed', onLogsFlushed);

// or, subscribe to all StatsigClientEvents
myStatsigClient.on('*', onAnyClientEvent);

// then later, unsubscribe from the events
myStatsigClient.off('logs_flushed', onLogsFlushed);
myStatsigClient.off('*', onAnyClientEvent);
// </snippet>
}
