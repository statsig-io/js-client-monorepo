import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigUser,
  StatsigEvent,
  StatsigEnvironment,
} from '@sigstat/core';

export { PrecomputedEvaluationsClient, StatsigOptions };

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    PrecomputedEvaluationsClient,
  };
}
