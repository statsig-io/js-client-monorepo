import { StatsigGlobal } from '@statsig/client-core';

import { AutoCapture, runStatsigAutoCapture } from './AutoCapture';

export { AutoCapture, runStatsigAutoCapture };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  AutoCapture,
  runStatsigAutoCapture,
} as StatsigGlobal;

export default __STATSIG__;
