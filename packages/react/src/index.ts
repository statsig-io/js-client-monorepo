import StatsigContext from './StatsigContext';
import StatsigProvider from './StatsigProvider';
import useGate from './useGate';

export { StatsigContext, StatsigProvider, useGate };

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}

window.__STATSIG__ = {
  ...window.__STATSIG__,
  StatsigProvider,
  useGate,
};
