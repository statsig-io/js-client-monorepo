export { StatsigUser, StatsigEvent, StatsigEnvironment } from '@sigstat/core';

import PrecomputedEvalutationsClient from './PrecomputedEvalutationsClient';
import { StatsigOptions } from './StatsigOptions';

export {
  PrecomputedEvalutationsClient as StatsigRemoteServerEvalClient,
  StatsigOptions,
};

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    PrecomputedEvalutationsClient: StatsigRemoteServerEvalClient,
  };
}
