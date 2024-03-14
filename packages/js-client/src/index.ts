import StatsigClient from './StatsigClient';
import { StatsigEvaluationsDataAdapter } from './StatsigEvaluationsDataAdapter';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

export { StatsigEvaluationsDataAdapter, StatsigClient, StatsigOptions };

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  StatsigEvaluationsDataAdapter,
  StatsigClient,
};
