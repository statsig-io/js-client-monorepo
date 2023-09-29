import StatsigOnDeviceEvalClient from './StatsigOnDeviceEvalClient';

export { StatsigOnDeviceEvalClient };

window.__STATSIG__ = {
  ...window.__STATSIG__,
  StatsigOnDeviceEvalClient,
};
