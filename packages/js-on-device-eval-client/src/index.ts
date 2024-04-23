import { StatsigGlobal } from '@statsig/client-core';

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

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  StatsigSpecsDataAdapter,
  StatsigOnDeviceEvalClient,
} as StatsigGlobal;

export default __STATSIG__;
