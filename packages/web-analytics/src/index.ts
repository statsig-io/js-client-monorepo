import { StatsigGlobal, _getStatsigGlobal } from '@statsig/client-core';

import {
  AutoCapture,
  StatsigAutoCapturePlugin,
  runStatsigAutoCapture,
} from './AutoCapture';

export type { AutoCaptureEvent } from './AutoCaptureEvent';
export { AutoCaptureEventName } from './AutoCaptureEvent';

export { AutoCapture, runStatsigAutoCapture, StatsigAutoCapturePlugin };

const __STATSIG__: StatsigGlobal = Object.assign(_getStatsigGlobal(), {
  AutoCapture,
  runStatsigAutoCapture,
  StatsigAutoCapturePlugin,
});

export default __STATSIG__;
