export * from '@statsig/react-bindings';

// RN environments should use the RN specific variants
const StatsigProvider = undefined as never;
const StatsigClient = undefined as never;
const useClientAsyncInit = undefined as never;
const useClientBootstrapInit = undefined as never;

export {
  StatsigProvider,
  StatsigClient,
  useClientAsyncInit,
  useClientBootstrapInit,
};

export { StatsigClientRN } from './StatsigClientRN';
export { StatsigProviderRN } from './StatsigProviderRN';
export { useClientAsyncInitRN } from './useClientAsyncInitRN';
export { useClientBootstrapInitRN } from './useClientBootstrapInitRN';
