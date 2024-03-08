import OnDeviceEvaluationsClient from './OnDeviceEvaluationsClient';
import { SpecsDataAdapter } from './SpecsDataAdapter';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type { StatsigOptions };
export { OnDeviceEvaluationsClient, SpecsDataAdapter };

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

__STATSIG__ = {
  ...__STATSIG__,
  SpecsDataAdapter,
  OnDeviceEvaluationsClient,
};
