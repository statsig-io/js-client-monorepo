import { SDKType, StatsigMetadataProvider } from '@statsig/client-core';
import { StatsigClient, StatsigOptions, StatsigUser } from '@statsig/js-client';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

export class StatsigClientExpo extends StatsigClient {
  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ) {
    SDKType._setBindingType('expo');
    StatsigMetadataProvider.add(GetStatsigMetadataAdditions());

    super(sdkKey, user, options);
  }
}
