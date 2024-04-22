import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { Storage, _notifyVisibilityChanged } from '@statsig/client-core';

Storage._setProvider({
  _getProviderName: () => 'AsyncStorage',
  _getItem: (key) => AsyncStorage.getItem(key),
  _setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  _removeItem: (key: string) => AsyncStorage.removeItem(key),
  _getAllKeys: () => AsyncStorage.getAllKeys(),
});

AppState.addEventListener('change', (nextAppState) =>
  _notifyVisibilityChanged(
    nextAppState === 'active' ? 'foreground' : 'background',
  ),
);

export type { StatsigProviderWithCacheWarmingProps } from './StatsigProviderWithCacheWarming';
export { StatsigProviderWithCacheWarming } from './StatsigProviderWithCacheWarming';

export * from './AsyncStorageWarming';
export * from './StatsigProviderWithCacheWarming';
