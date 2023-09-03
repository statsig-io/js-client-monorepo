import { StatsigClient } from '@statsig/core';
import StatsigContext from './StatsigContext';
import StatsigProvider from './StatsigProvider';
import useGate from './useGate';

export { StatsigClient, StatsigContext, StatsigProvider, useGate };

window.__STATSIG__ = {
  ...window.__STATSIG__,
  StatsigProvider,
  useGate,
};
