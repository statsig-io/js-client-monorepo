import { _getStatsigGlobal } from '@statsig/client-core';
import { SessionReplay } from '@statsig/session-replay';
import { AutoCapture } from '@statsig/web-analytics';

import { AutoInit } from './AutoInit';

const __STATSIG__ = _getStatsigGlobal();

export default __STATSIG__;

AutoInit.attempt(({ client }) => {
  new SessionReplay(client);
  new AutoCapture(client);
});
