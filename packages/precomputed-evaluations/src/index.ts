export type {
  StatsigUser,
  StatsigEvent,
  StatsigEnvironment,
} from '@sigstat/core';

import PrecomputedEvalutationsClient from './PrecomputedEvalutationsClient';
import type { StatsigOptions } from './StatsigOptions';

export { PrecomputedEvalutationsClient, StatsigOptions };

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    PrecomputedEvalutationsClient,
  };
}
