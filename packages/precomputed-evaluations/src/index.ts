import type { EvaluationDataProviderInterface } from './EvaluationDataProvider';
import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';
import { BootstrapEvaluationsDataProvider } from './data-providers/BootstrapEvaluationsDataProvider';
import { LocalStorageCacheEvaluationsDataProvider } from './data-providers/LocalStorageCacheEvaluationsDataProvider';
import { NetworkEvaluationsDataProvider } from './data-providers/NetworkEvaluationsDataProvider';
import { PrefetchEvaluationDataProvider } from './data-providers/PrefetchEvaluationsDataProvider';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@sigstat/core';

export {
  EvaluationDataProviderInterface,
  NetworkEvaluationsDataProvider,
  LocalStorageCacheEvaluationsDataProvider,
  BootstrapEvaluationsDataProvider,
  PrecomputedEvaluationsClient,
  PrefetchEvaluationDataProvider,
  StatsigOptions,
};

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  PrecomputedEvaluationsClient,
};
