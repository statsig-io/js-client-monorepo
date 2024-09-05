import {
  StatsigOnDeviceEvalClient,
  StatsigOptions,
} from '@statsig/js-on-device-eval-client';
import { _setupStatsigForReactNative } from '@statsig/react-native-core';

export class StatsigOnDeviceEvalClientExpo extends StatsigOnDeviceEvalClient {
  __isExpoClient = true;

  constructor(sdkKey: string, options: StatsigOptions | null = null) {
    const opts = options ?? {};
    _setupStatsigForReactNative('expo', null, opts);

    super(sdkKey, opts);
  }
}
