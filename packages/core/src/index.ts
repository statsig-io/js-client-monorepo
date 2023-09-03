import Statsig from './Statsig';
import StatsigClient from './StatsigClient';

export type { StatsigUser } from './StatsigUser';
export type { DynamicConfig, Experiment, Layer } from './StatsigTypes';

export { Statsig, StatsigClient };
export default Statsig;

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}

window.__STATSIG__ = {
  ...window.__STATSIG__,
  Statsig,
  StatsigClient,
};
