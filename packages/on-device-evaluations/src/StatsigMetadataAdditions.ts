import { StatsigMetadataProvider } from '@sigstat/core';

const SDK_TYPE = 'js-on-device-evaluations-client';

StatsigMetadataProvider.add({
  sdkType: SDK_TYPE,
});
