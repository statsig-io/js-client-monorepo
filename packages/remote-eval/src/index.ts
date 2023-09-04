import StatsigClient from './StatsigClient';

export { StatsigClient };

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}

window.__STATSIG__ = {
  ...window.__STATSIG__,
  StatsigClient,
};
