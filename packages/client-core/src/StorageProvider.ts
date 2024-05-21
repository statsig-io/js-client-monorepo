import { Log } from './Log';
import { _getWindowSafe } from './SafeJs';

export type StorageProvider = {
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

const _resolve = <T>(input?: unknown) => Promise.resolve<T>(input as T);

const _inMemoryProvider: StorageProvider = {
  _getProviderName: () => 'InMemory',
  _getItemSync: (key: string): string | null =>
    inMemoryStore[key] ? inMemoryStore[key] : null,
  _getItem: (key: string): Promise<string | null> =>
    _resolve(inMemoryStore[key] ? inMemoryStore[key] : null),
  _setItem: (key: string, value: string): Promise<void> => (
    (inMemoryStore[key] = value), _resolve()
  ),
  _removeItem: (key: string): Promise<void> => (
    delete inMemoryStore[key], _resolve()
  ),
  _getAllKeys: (): Promise<readonly string[]> =>
    _resolve(Object.keys(inMemoryStore)),
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
      _getProviderName: () => 'LocalStorage',
      _getItemSync: (key: string): string | null =>
        win.localStorage.getItem(key),
      _getItem: (key: string): Promise<string | null> =>
        _resolve(win.localStorage.getItem(key)),
      _setItem: (key: string, value: string): Promise<void> => (
        win.localStorage.setItem(key, value), _resolve()
      ),
      _removeItem: (key: string): Promise<void> => (
        win.localStorage.removeItem(key), _resolve()
      ),
      _getAllKeys: (): Promise<string[]> =>
        _resolve(Object.keys(win.localStorage)),
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
  _getProviderName: () => _current._getProviderName(),

  _getItem: async (key: string) =>
    _inMemoryBreaker(() => _current._getItem(key)),

  _getItemSync: (key: string) =>
    _inMemoryBreaker(() =>
      _current._getItemSync ? _current._getItemSync(key) : null,
    ),

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

export async function _getObjectFromStorage<T>(key: string): Promise<T | null> {
  const value = await Storage._getItem(key);
  return JSON.parse(value ?? 'null') as T | null;
}

export async function _setObjectInStorage(
  key: string,
  obj: unknown,
): Promise<void> {
  await Storage._setItem(key, JSON.stringify(obj));
}
