import { StatsigMetadataProvider } from '@statsig/client-core';

export const SDK_TYPE = 'javascript-client';

StatsigMetadataProvider.add({
  sdkType: SDK_TYPE,
});
