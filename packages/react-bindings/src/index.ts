import StatsigContext from './StatsigContext';
import StatsigProvider from './StatsigProvider';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useGate from './useGate';
import useLayer from './useLayer';

export {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
};

__STATSIG__ = {
  ...__STATSIG__,
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
};
