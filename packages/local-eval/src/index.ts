import StatsigLocalEvalClient from './StatsigLocalEvalClient';

export { StatsigLocalEvalClient };

window.__STATSIG__ = {
  ...window.__STATSIG__,
  StatsigLocalEvalClient,
};
