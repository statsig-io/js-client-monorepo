export * from '@statsig/react-bindings';

// RN environments should use the RN specific variants
const StatsigProvider = undefined as never;
const StatsigClient = undefined as never;

export { StatsigProvider, StatsigClient };

export { StatsigClientRN } from './StatsigClientRN';
export { StatsigProviderRN } from './StatsigProviderRN';
