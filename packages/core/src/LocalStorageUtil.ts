import { Log } from './Log';

type StorageProvider = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const inMemoryStore: Record<string, string> = {};

let provider: StorageProvider = {
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
};

try {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    provider = {
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
    };
  } else {
    const asyncStorage =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
      require('@react-native-async-storage/async-storage') as {
        [key: string]: unknown;
      };
    if (asyncStorage['default']) {
      provider = asyncStorage['default'] as StorageProvider;
    } else {
      provider = asyncStorage as StorageProvider;
    }
  }
} catch (error) {
  Log.warn(
    '[Statsig] Failed to get storage provider. Failling back to in memory store.',
  );
}

const Storage = provider;
export { Storage };

export async function getObjectFromStorage<T>(key: string): Promise<T | null> {
  const value = await Storage.getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export async function setObjectInStorage(
  key: string,
  obj: unknown,
): Promise<void> {
  await Storage.setItem(key, JSON.stringify(obj));
}
