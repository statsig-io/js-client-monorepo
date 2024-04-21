import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { Storage, VisibilityChangeObserver } from '@statsig/client-core';

Storage.setProvider({
  ...AsyncStorage,
  getProviderName: () => 'AsyncStorage',
});

AppState.addEventListener('change', (nextAppState) =>
  VisibilityChangeObserver.notify(
    nextAppState === 'active' ? 'foreground' : 'background',
  ),
);

export type { StatsigProviderWithCacheWarmingProps } from './StatsigProviderWithCacheWarming';
export { StatsigProviderWithCacheWarming } from './StatsigProviderWithCacheWarming';

export * from './AsyncStorageWarming';
export * from './StatsigProviderWithCacheWarming';
