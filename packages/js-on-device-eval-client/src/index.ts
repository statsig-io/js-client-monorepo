import { SpecsDataAdapter } from './SpecsDataAdapter';
import './StatsigMetadataAdditions';
import StatsigOnDeviceEvalClient from './StatsigOnDeviceEvalClient';
import type { StatsigOptions } from './StatsigOptions';

export type { StatsigOptions };
export { StatsigOnDeviceEvalClient, SpecsDataAdapter };

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

__STATSIG__ = {
  ...__STATSIG__,
  SpecsDataAdapter,
  StatsigOnDeviceEvalClient,
};
