import { AppState } from 'react-native';
import { MMKV } from 'react-native-mmkv';

import { Storage, _notifyVisibilityChanged } from '@statsig/client-core';

const storage = new MMKV();

Storage._setProvider({
  _getProviderName: () => 'MMKV Storage',
  _getItem: (key) => storage.getString(key) || null,
  _setItem: (key: string, value: string) => storage.set(key, value),
  _removeItem: (key: string) => storage.delete(key),
  _getAllKeys: () => storage.getAllKeys(),
});

AppState.addEventListener('change', (nextAppState) =>
  _notifyVisibilityChanged(
    nextAppState === 'active' ? 'foreground' : 'background',
  ),
);

export { StatsigProviderRNSyncStorage } from './StatsigProviderRNSyncStorage';

export * from './StatsigProviderRNSyncStorage';
