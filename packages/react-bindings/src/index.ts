import { StatsigGlobal } from '@statsig/client-core';

import StatsigContext from './StatsigContext';
import { StatsigProvider, StatsigProviderProps } from './StatsigProvider';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useFeatureGate from './useFeatureGate';
import useGateValue from './useGateValue';
import useLayer from './useLayer';
import useParameterStore from './useParameterStore';
import { useStatsigClient } from './useStatsigClient';
import { useStatsigOnDeviceEvalClient } from './useStatsigOnDeviceEvalClient';
import { useStatsigUser } from './useStatsigUser';

export type { StatsigProviderProps };

export {
  StatsigContext,
  StatsigProvider,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useParameterStore,
  useStatsigClient,
  useStatsigOnDeviceEvalClient,
  useStatsigUser,
};

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  StatsigContext,
  StatsigProvider,
  useDynamicConfig,
  useExperiment,
  useGateValue,
  useFeatureGate,
  useLayer,
  useStatsigOnDeviceEvalClient,
  useStatsigClient,
  useParameterStore,
} as StatsigGlobal;
