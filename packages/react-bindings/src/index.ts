import { _getStatsigGlobal } from '@statsig/client-core';

import StatsigContext from './StatsigContext';
import { StatsigProvider, StatsigProviderProps } from './StatsigProvider';
import { useClientAsyncInit } from './useClientAsyncInit';
import { useClientBootstrapInit } from './useClientBootstrapInit';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useFeatureGate from './useFeatureGate';
import useGateValue from './useGateValue';
import useLayer from './useLayer';
import useParameterStore from './useParameterStore';
import { useStatsigClient } from './useStatsigClient';
import { useStatsigInternalClientFactoryAsync } from './useStatsigInternalClientFactoryAsync';
import { useStatsigInternalClientFactoryBootstrap } from './useStatsigInternalClientFactoryBootstrap';
import { useStatsigUser } from './useStatsigUser';

export type { StatsigProviderProps };

export * from '@statsig/js-client';

export {
  StatsigContext,
  StatsigProvider,
  useClientAsyncInit,
  useClientBootstrapInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useParameterStore,
  useStatsigClient,
  useStatsigInternalClientFactoryAsync,
  useStatsigInternalClientFactoryBootstrap,
  useStatsigUser,
};

Object.assign(_getStatsigGlobal() ?? {}, {
  StatsigContext,
  StatsigProvider,
  useClientAsyncInit,
  useClientBootstrapInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useParameterStore,
  useStatsigClient,
  useStatsigInternalClientFactoryAsync,
  useStatsigInternalClientFactoryBootstrap,
  useStatsigUser,
});
