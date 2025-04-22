import { Log } from './Log';
import { _getWindowSafe } from './SafeJs';

export type StorageProvider = {
  isReady: () => boolean;
  isReadyResolver: () => Promise<void> | null;
  getProviderName: () => string;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  getAllKeys: () => readonly string[];
};

type StorageProviderManagment = {
  _setProvider: (newProvider: StorageProvider) => void;
  _setDisabled: (isDisabled: boolean) => void;
};

const inMemoryStore: Record<string, string> = {};

const _inMemoryProvider: StorageProvider = {
  isReady: () => true,
  isReadyResolver: () => null,
  getProviderName: () => 'InMemory',
  getItem: (key: string): string | null =>
    inMemoryStore[key] ? inMemoryStore[key] : null,
  setItem: (key: string, value: string): void => {
    inMemoryStore[key] = value;
  },
  removeItem: (key: string): void => {
    delete inMemoryStore[key];
  },
  getAllKeys: (): readonly string[] => Object.keys(inMemoryStore),
};

let _localStorageProvider: StorageProvider | null = null;
try {
  const win = _getWindowSafe();
  if (
    win &&
    win.localStorage &&
    typeof win.localStorage.getItem === 'function'
  ) {
    _localStorageProvider = {
      isReady: () => true,
      isReadyResolver: () => null,
      getProviderName: () => 'LocalStorage',
      getItem: (key: string): string | null => win.localStorage.getItem(key),
      setItem: (key: string, value: string): void =>
        win.localStorage.setItem(key, value),
      removeItem: (key: string): void => win.localStorage.removeItem(key),
      getAllKeys: (): string[] => Object.keys(win.localStorage),
    };
  }
} catch (error) {
  Log.warn('Failed to setup localStorageProvider.');
}

let _main: StorageProvider = _localStorageProvider ?? _inMemoryProvider;
let _current = _main;

function _inMemoryBreaker<T>(action: () => T) {
  try {
    return action();
  } catch (error) {
    if (error instanceof Error && error.name === 'SecurityError') {
      Storage._setProvider(_inMemoryProvider);
      return null;
    }

    if (error instanceof Error && error.name === 'QuotaExceededError') {
      const allKeys = Storage.getAllKeys();
      const statsigKeys = allKeys.filter((key) => key.startsWith('statsig.'));
      error.message = `${error.message}. Statsig Keys: ${statsigKeys.length}`;
    }

    throw error;
  }
}

export const Storage: StorageProvider & StorageProviderManagment = {
  isReady: () => _current.isReady(),
  isReadyResolver: () => _current.isReadyResolver(),
  getProviderName: () => _current.getProviderName(),

  getItem: (key: string) => _inMemoryBreaker(() => _current.getItem(key)),

  setItem: (key: string, value: string) =>
    _inMemoryBreaker(() => _current.setItem(key, value)),
  removeItem: (key: string) => _current.removeItem(key),
  getAllKeys: () => _current.getAllKeys(),

  // StorageProviderManagment
  _setProvider: (newProvider: StorageProvider) => {
    _main = newProvider;
    _current = newProvider;
  },

  _setDisabled: (isDisabled: boolean) => {
    if (isDisabled) {
      _current = _inMemoryProvider;
    } else {
      _current = _main;
    }
  },
};

export function _getObjectFromStorage<T>(key: string): T | null {
  const value = Storage.getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export function _setObjectInStorage(key: string, obj: unknown): void {
  Storage.setItem(key, JSON.stringify(obj));
}
