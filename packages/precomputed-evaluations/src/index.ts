import type { EvaluationDataProviderInterface } from './EvaluationDataProvider';
import {
  LocalEvaluationDataProvider,
  PrefetchEvaluationDataProvider,
} from './EvaluationDataProvider';
import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@sigstat/core';

export {
  EvaluationDataProviderInterface,
  LocalEvaluationDataProvider,
  PrecomputedEvaluationsClient,
  PrefetchEvaluationDataProvider,
  StatsigOptions,
};

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  PrecomputedEvaluationsClient,
};
