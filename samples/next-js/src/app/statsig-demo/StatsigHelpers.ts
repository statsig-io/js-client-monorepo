import Statsig, { LogEventObject, StatsigUser } from 'statsig-node';

import { MY_STATSIG_CLIENT_KEY, MY_STATSIG_SERVER_KEY } from './constants';

const isStatsigReady = Statsig.initialize(MY_STATSIG_SERVER_KEY); // <- Server Key

export async function getStatsigValues(user: StatsigUser): Promise<string> {
  await isStatsigReady;

  const values = Statsig.getClientInitializeResponse(
    user,
    MY_STATSIG_CLIENT_KEY, // <- Client Key
    {
      hash: 'djb2',
    },
  );

  return JSON.stringify(values);
}

export async function logEvents(events: LogEventObject[]): Promise<void> {
  await isStatsigReady;

  events.forEach((event) => Statsig.logEventObject(event));
}
