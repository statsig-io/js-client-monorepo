import { Log } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { SessionReplay } from '@statsig/session-replay';
import { AutoCapture } from '@statsig/web-analytics';

import { AutoInit } from './AutoInit';

export default __STATSIG__;

AutoInit.attempt(({ sdkKey }) => {
  const current: unknown = __STATSIG__?.instances?.[sdkKey];
  let client: StatsigClient | null = null;

  if (current instanceof StatsigClient) {
    client = current;
  }

  if (!client) {
    client = new StatsigClient(sdkKey, { userID: '' });
  }

  new SessionReplay(client);
  new AutoCapture(client);
  client.initializeAsync().catch((err) => {
    Log.error(err);
  });
});
