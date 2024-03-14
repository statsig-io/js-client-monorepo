import { Log } from './Log';

type StorageProvider = {
  getProviderName: () => string;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;

  getItemSync?: (key: string) => string | null;
};

type StorageProviderManagment = {
  setProvider: (n: StorageProvider) => void;
  disable: () => void;
  enable: () => void;
};

const inMemoryStore: Record<string, string> = {};

const _inMemoryProvider: StorageProvider = {
  getProviderName: () => 'InMemory',
  getItemSync(key: string): string | null {
    return inMemoryStore[key] ?? null;
  },
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(inMemoryStore[key] ?? null);
  },
  setItem(key: string, value: string): Promise<void> {
    inMemoryStore[key] = value;
    return Promise.resolve();
  },
  removeItem(key: string): Promise<void> {
    delete inMemoryStore[key];
    return Promise.resolve();
  },
  getAllKeys(): Promise<readonly string[]> {
    return Promise.resolve(Object.keys(inMemoryStore));
  },
};

let _localStorageProvider: StorageProvider | null = null;
try {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    _localStorageProvider = {
      getProviderName: () => 'LocalStorage',
      getItemSync(key: string): string | null {
        return localStorage.getItem(key);
      },
      getItem(key: string): Promise<string | null> {
        return Promise.resolve(localStorage.getItem(key));
      },
      setItem(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
      getAllKeys(): Promise<string[]> {
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
  getProviderName: () => _current.getProviderName(),
  getItem: (key: string) => _current.getItem(key),
  setItem: (key: string, value: string) => _current.setItem(key, value),
  removeItem: (key: string) => _current.removeItem(key),
  getAllKeys: () => _current.getAllKeys(),
  getItemSync: (key: string) => _current.getItemSync?.(key) ?? null,

  // StorageProviderManagment
  setProvider: (newProvider: StorageProvider) => {
    _main = newProvider;
    _current = newProvider;
  },
  enable: () => {
    _current = _main;
  },
  disable: () => {
    _current = _inMemoryProvider;
  },
};

export async function getObjectFromStorage<T>(key: string): Promise<T | null> {
  const value = await _current.getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export async function setObjectInStorage(
  key: string,
  obj: unknown,
): Promise<void> {
  await _current.setItem(key, JSON.stringify(obj));
}
