import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';
import { _setupStatsigForReactNative } from '@statsig/react-native-core';

export class StatsigOnDeviceEvalClientRN extends StatsigOnDeviceEvalClient {
  __isRnClient = true;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const opts = options ?? {};
    _setupStatsigForReactNative('rn', null, opts);

    super(sdkKey, opts);
  }
}
