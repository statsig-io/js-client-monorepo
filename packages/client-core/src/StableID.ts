import { _getStorageKey } from './CacheKey';
import { Log } from './Log';
import { _getObjectFromStorage, _setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

const PROMISE_MAP: Record<string, string> = {};

export const StableID = {
  get: (sdkKey: string): string => {
    if (PROMISE_MAP[sdkKey] == null) {
      let stableID = _loadFromStorage(sdkKey);
      if (stableID == null) {
        stableID = getUUID();
        _persistToStorage(stableID, sdkKey);
      }
      PROMISE_MAP[sdkKey] = stableID;
    }

    return PROMISE_MAP[sdkKey];
  },

  setOverride: (override: string, sdkKey: string): void => {
    PROMISE_MAP[sdkKey] = override;
    _persistToStorage(override, sdkKey);
  },
};

function _getStableIDStorageKey(sdkKey: string): string {
  return `statsig.stable_id.${_getStorageKey(sdkKey)}`;
}

function _persistToStorage(stableID: string, sdkKey: string) {
  const storageKey = _getStableIDStorageKey(sdkKey);
  try {
    _setObjectInStorage(storageKey, stableID);
  } catch (e) {
    Log.warn('Failed to save StableID');
  }
}

function _loadFromStorage(sdkKey: string) {
  const storageKey = _getStableIDStorageKey(sdkKey);
  return _getObjectFromStorage<string>(storageKey);
}
