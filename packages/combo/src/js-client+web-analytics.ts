import { AutoCapture } from '@statsig/web-analytics';

import { AutoInit } from './AutoInit';

export default __STATSIG__;

AutoInit.attempt(({ client }) => {
  new AutoCapture(client);
});
