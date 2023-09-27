export {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
} from '@statsig-client/react';

// const EXPORTS = {};

// export = {
//   ...EXPORTS,
// };

if (typeof window !== 'undefined') {
  window.__STATSIG__ = {
    ...window.__STATSIG__,
    // ...EXPORTS,
  };
}
