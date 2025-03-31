import { StatsigGlobal, _getStatsigGlobal } from '@statsig/client-core';

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

const __STATSIG__: StatsigGlobal = Object.assign(_getStatsigGlobal(), {
  StatsigClient,
});

export default __STATSIG__;
