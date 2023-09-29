import StatsigContext from './StatsigContext';
import StatsigProvider from './StatsigProvider';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useGate from './useGate';
import useLayer from './useLayer';

const EXPORTS = {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
};

export = {
  ...EXPORTS,
};

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    ...EXPORTS,
  };
}