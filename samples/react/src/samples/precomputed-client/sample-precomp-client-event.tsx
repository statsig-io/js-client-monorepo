/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-unused-vars */
// <snippet>
import type { StatsigClientEventData } from '@statsig/client-core';

// </snippet>
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const onClientEvent = (data: StatsigClientEventData) => {
  console.log("Statsig Logs", data);
};

// subscribe to an individual StatsigClientEvent
myStatsigClient.on('logs_flushed', onClientEvent);

// or, subscribe to all StatsigClientEvents
myStatsigClient.on('*', onClientEvent);

// then later, unsubscribe from the events
myStatsigClient.off('logs_flushed', onClientEvent);
myStatsigClient.off('*', onClientEvent);
// </snippet>
}
