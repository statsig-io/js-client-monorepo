import StatsigContext from './StatsigContext';
import { StatsigProvider, StatsigProviderProps } from './StatsigProvider';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useGate from './useGate';
import useLayer from './useLayer';
import useStatsigOnDeviceEvaluationsClient from './useStatsigOnDeviceEvaluationsClient';
import useStatsigPrecomputedEvaluationsClient from './useStatsigPrecomputedEvaluationsClient';
import useStatsigUser from './useStatsigUser';

export type { StatsigProviderProps };

export {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
  useStatsigUser,
  useStatsigOnDeviceEvaluationsClient,
  useStatsigPrecomputedEvaluationsClient,
};

__STATSIG__ = {
  ...__STATSIG__,
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
  useStatsigOnDeviceEvaluationsClient,
  useStatsigPrecomputedEvaluationsClient,
};
