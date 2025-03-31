import __STATSIG__ from '@statsig/js-client';
import { SessionReplay } from '@statsig/session-replay';

import { AutoInit } from './AutoInit';

export default __STATSIG__;

AutoInit.attempt(({ client }) => {
  new SessionReplay(client);
});
