export * from '@statsig/react-bindings';

// Expo environments should use the Expo specific variants
const StatsigProvider = undefined as never;
const StatsigClient = undefined as never;

export { StatsigProvider, StatsigClient };

export { StatsigClientExpo } from './StatsigClientExpo';
export { StatsigProviderExpo } from './StatsigProviderExpo';
