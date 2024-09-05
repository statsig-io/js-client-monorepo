import {
  AnyStatsigOptions,
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
}
