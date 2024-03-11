import { Log } from './Log';

type StorageProvider = {
  getProviderName: () => string;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;
};

const inMemoryStore: Record<string, string> = {};

let provider: StorageProvider = {
  getProviderName: () => 'InMemory',
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

try {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    provider = {
      getProviderName: () => 'LocalStorage',
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
  Log.warn('Failed to get storage provider. Failling back to in memory store.');
}

export const Storage: StorageProvider & {
  setProvider: (n: StorageProvider) => void;
} = {
  getProviderName: () => provider.getProviderName(),
  getItem: (key: string) => provider.getItem(key),
  setItem: (key: string, value: string) => provider.setItem(key, value),
  removeItem: (key: string) => provider.removeItem(key),
  getAllKeys: () => provider.getAllKeys(),
  setProvider: (newProvider: StorageProvider) => {
    provider = newProvider;
  },
};

export async function getObjectFromStorage<T>(key: string): Promise<T | null> {
  const value = await provider.getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export async function setObjectInStorage(
  key: string,
  obj: unknown,
): Promise<void> {
  await provider.setItem(key, JSON.stringify(obj));
}
