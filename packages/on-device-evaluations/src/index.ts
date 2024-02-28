import OnDeviceEvaluationsClient from './OnDeviceEvaluationsClient';
import './StatsigMetadataAdditions';
import type { StatsigOptions } from './StatsigOptions';
import { BootstrapSpecsDataProvider } from './data-providers/BootstrapSpecsDataProvider';
import { LocalStorageCacheSpecsDataProvider } from './data-providers/LocalStorageCacheSpecsDataProvider';
import { NetworkSpecsDataProvider } from './data-providers/NetworkSpecsDataProvider';

export type { StatsigOptions };
export {
  BootstrapSpecsDataProvider,
  LocalStorageCacheSpecsDataProvider,
  NetworkSpecsDataProvider,
  OnDeviceEvaluationsClient,
};

export type {
  StatsigEnvironment,
  StatsigEvent,
  StatsigUser,
} from '@statsig/client-core';

__STATSIG__ = {
  ...__STATSIG__,
  OnDeviceEvaluationsClient,
  BootstrapSpecsDataProvider,
  LocalStorageCacheSpecsDataProvider,
  NetworkSpecsDataProvider,
};
