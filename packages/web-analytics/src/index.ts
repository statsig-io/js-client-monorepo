import { StatsigGlobal } from '@statsig/client-core';

import {
  AutoCapture,
  StatsigAutoCapturePlugin,
  runStatsigAutoCapture,
} from './AutoCapture';

export type {
  AutoCaptureEvent,
  AutoCaptureEventName,
} from './AutoCaptureEvent';

export { AutoCapture, runStatsigAutoCapture, StatsigAutoCapturePlugin };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  AutoCapture,
  runStatsigAutoCapture,
  StatsigAutoCapturePlugin,
} as StatsigGlobal;

export default __STATSIG__;
