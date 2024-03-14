import { StatsigMetadataProvider } from '@statsig/client-core';

const SDK_TYPE = 'js-on-device-eval-client';

StatsigMetadataProvider.add({
  sdkType: SDK_TYPE,
});
