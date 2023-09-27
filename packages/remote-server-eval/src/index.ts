export {
  StatsigUser,
  StatsigEvent,
  StatsigEnvironment,
} from 'dloomb-client-core';

import StatsigRemoteServerEvalClient from './StatsigRemoteServerEvalClient';
import { StatsigOptions } from './StatsigOptions';

export { StatsigRemoteServerEvalClient, StatsigOptions };

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    StatsigRemoteServerEvalClient,
  };
}
