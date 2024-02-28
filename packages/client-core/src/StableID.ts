import { DJB2 } from './Hashing';
import { Log } from './Log';
import { getObjectFromStorage, setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

let stableIDPromise: Promise<string> | null = null;

function persistToStorage(stableID: string, sdkKey: string) {
  const storageKey = getStorageKey(sdkKey);

  setObjectInStorage(storageKey, stableID).catch(() => {
    Log.warn('Failed to save StableID');
  });
}

function loadFromStorage(sdkKey: string) {
  const storageKey = getStorageKey(sdkKey);
  return getObjectFromStorage<string>(storageKey);
}

export function getStorageKey(sdkKey: string): string {
  return `STATSIG_STABLE_ID:${DJB2(sdkKey)}`;
}

export const StableID = {
  get: async (sdkKey: string): Promise<string> => {
    if (stableIDPromise == null) {
      stableIDPromise = loadFromStorage(sdkKey).then((stableID) => {
        if (stableID != null) {
          return stableID;
        }

        const newStableID = getUUID();
        persistToStorage(newStableID, sdkKey);
        return newStableID;
      });
    }

    return stableIDPromise;
  },

  setOverride: (override: string, sdkKey: string): void => {
    stableIDPromise = Promise.resolve(override);
    persistToStorage(override, sdkKey);
  },
};
