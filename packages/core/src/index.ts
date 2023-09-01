import Statsig from './Statsig';
import StatsigClient from './StatsigClient';

export { Statsig, StatsigClient };
export default Statsig;

declare global {
  interface Window {
    __STATSIG__: typeof Statsig;
  }
}

window.__STATSIG__ = Statsig;
