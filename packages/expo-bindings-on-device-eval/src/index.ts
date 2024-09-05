export * from '@statsig/react-bindings-on-device-eval';

// Expo environments should use the Expo specific variants
const StatsigProviderOnDeviceEval = undefined as never;
const StatsigOnDeviceEvalClient = undefined as never;

export { StatsigProviderOnDeviceEval, StatsigOnDeviceEvalClient };

export { StatsigOnDeviceEvalClientExpo } from './StatsigOnDeviceEvalClientExpo';
export { StatsigProviderOnDeviceEvalExpo } from './StatsigProviderOnDeviceEvalExpo';
