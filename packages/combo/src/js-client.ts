import {
  StatsigClient,
  StatsigEvaluationsDataAdapter,
} from '@statsig/js-client';
import type { StatsigOptions } from '@statsig/js-client';

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
};

export default __STATSIG__;
