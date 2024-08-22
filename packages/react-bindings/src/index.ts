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
import { useOnDeviceClientAsyncInit } from './useOnDeviceClientAsyncInit';
import { useOnDeviceClientBootstrapInit } from './useOnDeviceClientBootstrapInit';
import useParameterStore from './useParameterStore';
import { useStatsigClient } from './useStatsigClient';
import { useStatsigOnDeviceEvalClient } from './useStatsigOnDeviceEvalClient';
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
  useOnDeviceClientAsyncInit,
  useOnDeviceClientBootstrapInit,
  useParameterStore,
  useStatsigClient,
  useStatsigOnDeviceEvalClient,
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
  useOnDeviceClientAsyncInit,
  useOnDeviceClientBootstrapInit,
  useParameterStore,
  useStatsigClient,
  useStatsigOnDeviceEvalClient,
  useStatsigUser,
} as StatsigGlobal;
