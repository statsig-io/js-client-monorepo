import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import './StatsigMetadataProvider';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigUser,
  StatsigEvent,
  StatsigEnvironment,
} from '@sigstat/core';

export { PrecomputedEvaluationsClient, StatsigOptions };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  PrecomputedEvaluationsClient,
};
