export * from '@statsig/react-bindings-on-device-eval';

// RN environments should use the RN specific variants
const StatsigProviderOnDeviceEval = undefined as never;
const StatsigOnDeviceEvalClient = undefined as never;

export { StatsigProviderOnDeviceEval, StatsigOnDeviceEvalClient };

export { StatsigOnDeviceEvalClientRN } from './StatsigOnDeviceEvalClientRN';
export { StatsigProviderOnDeviceEvalRN } from './StatsigProviderOnDeviceEvalRN';
