import { StatsigGlobal } from '@statsig/client-core';

import StatsigClient from './StatsigClient';
import type { StatsigOptions } from './StatsigOptions';

export * from '@statsig/client-core';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
  InitializeResponse,
  StatsigPlugin,
} from '@statsig/client-core';

export type { StatsigOptions };

export { StatsigClient };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  StatsigClient,
} as StatsigGlobal;

export default __STATSIG__ as StatsigGlobal;
