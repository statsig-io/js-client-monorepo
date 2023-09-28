type StorageProvider = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let provider: StorageProvider;

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    provider = require('@react-native-async-storage/async-storage');
  }
} catch (error) {
  console.warn(
    '[Statsig] Failed to get storage provider. Failling back to in memory store.',
  );
  const inMemoryStore: Record<string, string> = {};
  provider = {
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
