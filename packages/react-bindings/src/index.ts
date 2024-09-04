import { StatsigGlobal } from '@statsig/client-core';

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
import { useStatsigUser } from './useStatsigUser';

export type { StatsigProviderProps };

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
  useStatsigUser,
};

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
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
  useStatsigUser,
} as StatsigGlobal;
