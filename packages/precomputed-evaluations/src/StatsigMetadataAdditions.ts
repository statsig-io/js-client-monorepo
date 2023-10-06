import { StatsigMetadataProvider } from '@sigstat/core';

export const SDK_TYPE = 'js-precomputed-evaluations-client';

StatsigMetadataProvider.add({
  sdkType: SDK_TYPE,
});
