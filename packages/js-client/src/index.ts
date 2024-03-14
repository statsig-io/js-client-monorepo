import { EvaluationsDataAdapter } from './EvaluationsDataAdapter';
import StatsigClient from './StatsigClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

export { EvaluationsDataAdapter, StatsigClient, StatsigOptions };

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  EvaluationsDataAdapter,
  StatsigClient,
};
