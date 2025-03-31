import { StatsigGlobal, _getStatsigGlobal } from '@statsig/client-core';

import StatsigOnDeviceEvalClient from './StatsigOnDeviceEvalClient';
import type { StatsigOptions } from './StatsigOptions';
import { StatsigSpecsDataAdapter } from './StatsigSpecsDataAdapter';

export type { StatsigOptions };
export { StatsigOnDeviceEvalClient, StatsigSpecsDataAdapter };

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

const __STATSIG__: StatsigGlobal = Object.assign(_getStatsigGlobal(), {
  StatsigSpecsDataAdapter,
  StatsigOnDeviceEvalClient,
});

export default __STATSIG__;
