import StatsigRemoteEvalClient from './StatsigRemoteEvalClient';

export { StatsigRemoteEvalClient };

window.__STATSIG__ = {
  ...window.__STATSIG__,
  StatsigRemoteEvalClient,
};
