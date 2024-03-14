import StatsigContext from './StatsigContext';
import { StatsigProvider, StatsigProviderProps } from './StatsigProvider';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useGate from './useGate';
import useLayer from './useLayer';
import { useStatsigClient } from './useStatsigClient';
import { useStatsigOnDeviceEvalClient } from './useStatsigOnDeviceEvalClient';
import { useStatsigUser } from './useStatsigUser';

export type { StatsigProviderProps };

export {
  StatsigContext,
  StatsigProvider,
  useDynamicConfig,
  useExperiment,
  useGate,
  useLayer,
  useStatsigOnDeviceEvalClient,
  useStatsigClient,
  useStatsigUser,
};

__STATSIG__ = {
  ...__STATSIG__,
  StatsigContext,
  StatsigProvider,
  useDynamicConfig,
  useExperiment,
  useGate,
  useLayer,
  useStatsigOnDeviceEvalClient,
  useStatsigClient,
};
