import { Log } from './Log';
import { _getWindowSafe } from './SafeJs';

export type StorageProvider = {
  _isProviderReady: () => Promise<void> | null;
  _getProviderName: () => string;
  _getItem: (key: string) => string | null;
  _setItem: (key: string, value: string) => void;
  _removeItem: (key: string) => void;
  _getAllKeys: () => readonly string[];
};

type StorageProviderManagment = {
  _setProvider: (newProvider: StorageProvider) => void;
  _setDisabled: (isDisabled: boolean) => void;
};

const inMemoryStore: Record<string, string> = {};

const _inMemoryProvider: StorageProvider = {
  _isProviderReady: () => null,
  _getProviderName: () => 'InMemory',
  _getItem: (key: string): string | null =>
    inMemoryStore[key] ? inMemoryStore[key] : null,
  _setItem: (key: string, value: string): void => {
    inMemoryStore[key] = value;
  },
  _removeItem: (key: string): void => {
    delete inMemoryStore[key];
  },
  _getAllKeys: (): readonly string[] => Object.keys(inMemoryStore),
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
      _isProviderReady: () => null,
      _getProviderName: () => 'LocalStorage',
      _getItem: (key: string): string | null => win.localStorage.getItem(key),
      _setItem: (key: string, value: string): void =>
        win.localStorage.setItem(key, value),
      _removeItem: (key: string): void => win.localStorage.removeItem(key),
      _getAllKeys: (): string[] => Object.keys(win.localStorage),
    };
  }
} catch (error) {
  Log.warn('Failed to setup localStorageProvider.');
}

let _main: StorageProvider = _localStorageProvider ?? _inMemoryProvider;
let _current = _main;

function _inMemoryBreaker<T>(get: () => T) {
  try {
    return get();
  } catch (error) {
    if (error instanceof Error && error.name === 'SecurityError') {
      Storage._setProvider(_inMemoryProvider);
      return null;
    }
    throw error;
  }
}

export const Storage: StorageProvider & StorageProviderManagment = {
  _isProviderReady: () => _current._isProviderReady() ?? null,
  _getProviderName: () => _current._getProviderName(),

  _getItem: (key: string) => _inMemoryBreaker(() => _current._getItem(key)),

  _setItem: (key: string, value: string) => _current._setItem(key, value),
  _removeItem: (key: string) => _current._removeItem(key),
  _getAllKeys: () => _current._getAllKeys(),

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
  const value = Storage._getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export function _setObjectInStorage(key: string, obj: unknown): void {
  Storage._setItem(key, JSON.stringify(obj));
}
