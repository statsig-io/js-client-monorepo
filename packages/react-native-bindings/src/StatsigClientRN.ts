import { StatsigClient, StatsigOptions, StatsigUser } from '@statsig/js-client';
import { _setupStatsigForReactNative } from '@statsig/react-native-core';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

export class StatsigClientRN extends StatsigClient {
  __isRnClient = true;

  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    const opts = options ?? {};
    _setupStatsigForReactNative('rn', GetStatsigMetadataAdditions(), opts);

    super(sdkKey, user, opts);
  }
}
