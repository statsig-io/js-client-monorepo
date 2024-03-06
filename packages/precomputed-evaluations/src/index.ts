import PrecomputedEvaluationsClient from './PrecomputedEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';
import { BootstrapEvaluationsDataProvider } from './data-providers/BootstrapEvaluationsDataProvider';
import { LocalStorageCacheEvaluationsDataProvider } from './data-providers/LocalStorageCacheEvaluationsDataProvider';
import { DelayedNetworkEvaluationsDataProvider } from './data-providers/NetworkEvaluationsDataProvider';
import { NetworkEvaluationsDataProvider } from './data-providers/NetworkEvaluationsDataProvider';
import { PrefetchEvaluationDataProvider } from './data-providers/PrefetchEvaluationsDataProvider';

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

export {
  NetworkEvaluationsDataProvider,
  LocalStorageCacheEvaluationsDataProvider,
  BootstrapEvaluationsDataProvider,
  PrecomputedEvaluationsClient,
  PrefetchEvaluationDataProvider,
  DelayedNetworkEvaluationsDataProvider,
  StatsigOptions,
};

export type { EvaluationResponse } from './EvaluationData';

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  PrecomputedEvaluationsClient,
};
