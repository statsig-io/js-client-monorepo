import type { EvaluationDataProviderInterface } from './EvaluationDataProvider';
import { LocalEvaluationDataProvider } from './EvaluationDataProvider';
import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigUser,
  StatsigEvent,
  StatsigEnvironment,
} from '@sigstat/core';

export {
  PrecomputedEvaluationsClient,
  StatsigOptions,
  LocalEvaluationDataProvider,
  EvaluationDataProviderInterface,
};

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  PrecomputedEvaluationsClient,
};
