import { StatsigGlobal } from '@statsig/client-core';

import {
  AutoCapture,
  StatsigAutoCapturePlugin,
  runStatsigAutoCapture,
} from './AutoCapture';

export { AutoCaptureEvent } from './AutoCaptureEvent';

export { AutoCapture, runStatsigAutoCapture, StatsigAutoCapturePlugin, AutoCaptureEventName };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  AutoCapture,
  runStatsigAutoCapture,
  StatsigAutoCapturePlugin,
} as StatsigGlobal;

export default __STATSIG__;
