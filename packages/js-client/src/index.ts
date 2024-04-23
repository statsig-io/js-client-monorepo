import { StatsigGlobal } from '@statsig/client-core';

import StatsigClient from './StatsigClient';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
  InitializeResponse,
} from '@statsig/client-core';

export { StatsigEvaluationsDataAdapter, StatsigClient, StatsigOptions };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  StatsigEvaluationsDataAdapter,
  StatsigClient,
} as StatsigGlobal;

export default __STATSIG__ as StatsigGlobal;
