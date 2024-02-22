import OnDeviceEvaluationsClient from './OnDeviceEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type { StatsigOptions };
export { OnDeviceEvaluationsClient };

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@sigstat/core';

__STATSIG__ = {
  ...__STATSIG__,
  OnDeviceEvaluationsClient,
};
