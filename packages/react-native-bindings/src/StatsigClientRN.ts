import { StatsigOptions, StatsigUser } from '@statsig/js-client';
import { StatsigClientReactNativeBase } from '@statsig/react-native-core';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

export class StatsigClientRN extends StatsigClientReactNativeBase {
  __isRnClient = true;

  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    super(sdkKey, user, options, 'rn', GetStatsigMetadataAdditions());
  }
}
