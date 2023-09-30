import { StatsigMetadata, StatsigMetadataCore } from '@sigstat/core';

export const SDK_TYPE = 'js-precomputed-evaluations-client';

const metadata = {
  ...StatsigMetadataCore,
  sdkType: SDK_TYPE,
} as StatsigMetadata;

export { metadata as StatsigMetadata };
