export * from '@statsig/react-bindings';

// Expo environments should use the Expo specific variants
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

export { StatsigClientExpo } from './StatsigClientExpo';
export { StatsigProviderExpo } from './StatsigProviderExpo';
export { useClientAsyncInitExpo } from './useClientAsyncInitExpo';
export { useClientBootstrapInitExpo } from './useClientBootstrapInitExpo';
