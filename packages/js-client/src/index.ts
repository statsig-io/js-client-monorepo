import { StatsigGlobal } from '@statsig/client-core';

import StatsigClient from './StatsigClient';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
  InitializeResponse,
} from '@statsig/client-core';

export { StatsigClient, StatsigOptions };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  StatsigClient,
} as StatsigGlobal;

export default __STATSIG__ as StatsigGlobal;
