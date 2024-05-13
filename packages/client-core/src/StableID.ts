import { _getStorageKey } from './CacheKey';
import { Log } from './Log';
import { _getObjectFromStorage, _setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

const PROMISE_MAP: Record<string, Promise<string>> = {};

export const StableID = {
  get: async (sdkKey: string): Promise<string> => {
    if (PROMISE_MAP[sdkKey] == null) {
      PROMISE_MAP[sdkKey] = _loadFromStorage(sdkKey).then((stableID) => {
        if (stableID != null) {
          return stableID;
        }

        const newStableID = getUUID();
        _persistToStorage(newStableID, sdkKey);
        return newStableID;
      });
    }

    return PROMISE_MAP[sdkKey];
  },

  setOverride: (override: string, sdkKey: string): void => {
    PROMISE_MAP[sdkKey] = Promise.resolve(override);
    _persistToStorage(override, sdkKey);
  },
};

function _getStableIDStorageKey(sdkKey: string): string {
  return `statsig.stable_id.${_getStorageKey(sdkKey)}`;
}

function _persistToStorage(stableID: string, sdkKey: string) {
  const storageKey = _getStableIDStorageKey(sdkKey);

  _setObjectInStorage(storageKey, stableID).catch(() => {
    Log.warn('Failed to save StableID');
  });
}

function _loadFromStorage(sdkKey: string) {
  const storageKey = _getStableIDStorageKey(sdkKey);
  return _getObjectFromStorage<string>(storageKey);
}
