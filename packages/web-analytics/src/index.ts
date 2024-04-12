import { AutoCapture, runStatsigAutoCapture } from './AutoCapture';

export { AutoCapture, runStatsigAutoCapture };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  AutoCapture,
  runStatsigAutoCapture,
};

export default __STATSIG__;
