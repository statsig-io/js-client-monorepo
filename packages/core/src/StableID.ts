import { Log } from './Log';
import { getObjectFromStorage, setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

export const STATSIG_STABLE_ID_KEY = 'STATSIG_STABLE_ID';

let stableIDPromise: Promise<string> | null = null;

function persistToStorage(stableID: string) {
  setObjectInStorage(STATSIG_STABLE_ID_KEY, stableID).catch(() => {
    Log.warn('Failed to save StableID');
  });
}

export const StableID = {
  get: async (): Promise<string> => {
    if (stableIDPromise == null) {
      stableIDPromise = getObjectFromStorage<string>(
        STATSIG_STABLE_ID_KEY,
      ).then((stableID) => {
        if (stableID != null) {
          return stableID;
        }

        const newStableID = getUUID();
        persistToStorage(newStableID);
        return newStableID;
      });
    }

    return stableIDPromise;
  },

  setOverride: (override: string): void => {
    stableIDPromise = Promise.resolve(override);
    persistToStorage(override);
  },
};
