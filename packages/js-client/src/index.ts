import StatsigClient from './StatsigClient';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

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
