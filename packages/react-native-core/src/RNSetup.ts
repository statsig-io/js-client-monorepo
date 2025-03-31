import {
  AnyStatsigOptions,
  NetworkArgs,
  SDKType,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { _applyAppStateVisibilityShim } from './AppVisiblityShim';
import { _createPreloadedAsyncStorage } from './PreloadedAsyncStorage';

export function _setupStatsigForReactNative(
  type: 'rn' | 'expo',
  statsigMetadataAdditions: Record<string, string | undefined> | null,
  options: AnyStatsigOptions,
): void {
  _applyAppStateVisibilityShim();

  SDKType._setBindingType(type);
  if (statsigMetadataAdditions) {
    StatsigMetadataProvider.add(statsigMetadataAdditions);
  }

  if (options.storageProvider == null) {
    options.storageProvider = _createPreloadedAsyncStorage();
  }

  _applyNetworkFix(options);
}

function _applyNetworkFix(options: AnyStatsigOptions) {
  if (options.networkConfig?.networkOverrideFunc != null) {
    return;
  }

  const networkOverrideFunc = (url: string, args: NetworkArgs) => {
    if (args.body != null && args.method === 'POST') {
      args.headers = {
        'Content-Type': 'application/json',
        ...args.headers,
      };
    }
    return fetch(url, args);
  };

  options.networkConfig = {
    networkOverrideFunc,
    ...options.networkConfig,
  };
}
