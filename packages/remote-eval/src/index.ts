export {
  StatsigUser,
  StatsigEvent,
  StatsigEnvironment,
} from '@statsig-client/core';

import StatsigRemoteEvalClient from './StatsigRemoteEvalClient';
import { StatsigOptions } from './StatsigOptions';

export { StatsigRemoteEvalClient, StatsigOptions };

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    StatsigRemoteEvalClient,
  };
}
