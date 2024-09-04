import AsyncStorage from '@react-native-async-storage/async-storage';

import { Log, StorageProvider } from '@statsig/client-core';

const NOT_READY_ERROR =
  'Attempting to alter AsyncStorage before it is ready. Values will not be persisted.';

export function _createPreloadedAsyncStorage(): StorageProvider {
  const inMemoryStore: Record<string, string> = {};
  let isResolved = false;

  const enforceIsResolved = () => {
    if (!isResolved) {
      Log.error(NOT_READY_ERROR);
    }

    return isResolved;
  };

  const provider = {
    _getProviderName: function (): string {
      return 'AsyncStorage';
    },

    _isProviderReady: () =>
      _prefetchFromAsyncStorage(inMemoryStore).finally(() => {
        isResolved = true;
      }),

    _getItem: function (key: string): string | null {
      if (!enforceIsResolved()) {
        return null;
      }

      return inMemoryStore[key] ?? null;
    },

    _setItem: function (key: string, value: string): void {
      inMemoryStore[key] = value;
      if (!enforceIsResolved()) {
        return;
      }

      AsyncStorage.setItem(key, value).catch(Log.error);
    },

    _removeItem: function (key: string): void {
      delete inMemoryStore[key];
      if (!enforceIsResolved()) {
        return;
      }

      AsyncStorage.removeItem(key).catch(Log.error);
    },

    _getAllKeys: function (): readonly string[] {
      if (!enforceIsResolved()) {
        return [];
      }

      return Object.keys(inMemoryStore);
    },
  };

  return provider;
}

async function _prefetchFromAsyncStorage(
  inMemoryStore: Record<string, string>,
): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();

  await Promise.all(
    keys.map(async (key) => {
      if (!key.startsWith('statsig.')) {
        return;
      }

      const cache = await AsyncStorage.getItem(key);
      if (!cache) {
        return;
      }

      inMemoryStore[key] = cache;
    }),
  );
}
