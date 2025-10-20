import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';

export class StatsigServerlessClient extends StatsigOnDeviceEvalClient {
  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const edgeSafeOptions: StatsigOptions = {
      disableStorage: true,
      loggingEnabled: 'always',
      includeCurrentPageUrlWithEvents: false,
      ...options,
    };
    super(sdkKey, edgeSafeOptions);
  }
}
