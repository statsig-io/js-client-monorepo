import { Log } from './Log';

type StorageProvider = {
  _getProviderName: () => string;
  _getItem: (key: string) => Promise<string | null>;
  _setItem: (key: string, value: string) => Promise<void>;
  _removeItem: (key: string) => Promise<void>;
  _getAllKeys: () => Promise<readonly string[]>;

  _getItemSync?: (key: string) => string | null;
};

type StorageProviderManagment = {
  _setProvider: (newProvider: StorageProvider) => void;
  _setDisabled: (isDisabled: boolean) => void;
};

const inMemoryStore: Record<string, string> = {};

const _inMemoryProvider: StorageProvider = {
  _getProviderName: () => 'InMemory',
  _getItemSync(key: string): string | null {
    return inMemoryStore[key] ?? null;
  },
  _getItem(key: string): Promise<string | null> {
    return Promise.resolve(inMemoryStore[key] ?? null);
  },
  _setItem(key: string, value: string): Promise<void> {
    inMemoryStore[key] = value;
    return Promise.resolve();
  },
  _removeItem(key: string): Promise<void> {
    delete inMemoryStore[key];
    return Promise.resolve();
  },
  _getAllKeys(): Promise<readonly string[]> {
    return Promise.resolve(Object.keys(inMemoryStore));
  },
};

let _localStorageProvider: StorageProvider | null = null;
try {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    _localStorageProvider = {
      _getProviderName: () => 'LocalStorage',
      _getItemSync(key: string): string | null {
        return localStorage.getItem(key);
      },
      _getItem(key: string): Promise<string | null> {
        return Promise.resolve(localStorage.getItem(key));
      },
      _setItem(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      _removeItem(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
      _getAllKeys(): Promise<string[]> {
        const keys = Object.keys(localStorage);
        return Promise.resolve(keys);
      },
    };
  }
} catch (error) {
  Log.warn('Failed to setup localStorageProvider.');
}

let _main: StorageProvider = _localStorageProvider ?? _inMemoryProvider;
let _current = _main;

export const Storage: StorageProvider & StorageProviderManagment = {
  _getProviderName: () => _current._getProviderName(),
  _getItem: (key: string) => _current._getItem(key),
  _setItem: (key: string, value: string) => _current._setItem(key, value),
  _removeItem: (key: string) => _current._removeItem(key),
  _getAllKeys: () => _current._getAllKeys(),
  _getItemSync: (key: string) => _current._getItemSync?.(key) ?? null,

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

export async function _getObjectFromStorage<T>(key: string): Promise<T | null> {
  const value = await _current._getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export async function _setObjectInStorage(
  key: string,
  obj: unknown,
): Promise<void> {
  await _current._setItem(key, JSON.stringify(obj));
}
