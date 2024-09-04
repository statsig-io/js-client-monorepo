import { SDKType, StatsigMetadataProvider } from '@statsig/client-core';
import { StatsigClient, StatsigOptions, StatsigUser } from '@statsig/js-client';

import { _applyAppStateVisibilityShim } from './AppVisiblityShim';
import { _createPreloadedAsyncStorage } from './PreloadedAsyncStorage';

export class StatsigClientReactNativeBase extends StatsigClient {
  constructor(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
    type: 'rn' | 'expo',
    statsigMetadataAdditions: Record<string, string | undefined>,
  ) {
    const opts = options ?? {};
    _setupStatsigForReactNative(type, statsigMetadataAdditions, opts);

    super(sdkKey, user, opts);
  }
}

export function _setupStatsigForReactNative(
  type: 'rn' | 'expo',
  statsigMetadataAdditions: Record<string, string | undefined>,
  options: StatsigOptions,
): void {
  _applyAppStateVisibilityShim();

  SDKType._setBindingType(type);
  StatsigMetadataProvider.add(statsigMetadataAdditions);

  if (options.storageProvider == null) {
    options.storageProvider = _createPreloadedAsyncStorage();
  }
}
