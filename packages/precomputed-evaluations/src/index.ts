import { EvaluationsDataAdapter } from './EvaluationsDataAdapter';
import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

export { EvaluationsDataAdapter, PrecomputedEvaluationsClient, StatsigOptions };

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
};
