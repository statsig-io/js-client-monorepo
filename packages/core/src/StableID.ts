import { getObjectFromStorage, setObjectInStorage } from './LocalStorageUtil';
import { Log } from './Log';
import { getUUID } from './UUID';

export const STATSIG_STABLE_ID_KEY = 'STATSIG_STABLE_ID';

let stableID: string | null = null;

function persistToStorage() {
  setObjectInStorage(STATSIG_STABLE_ID_KEY, stableID).catch(() => {
    Log.warn('Failed to save StableID');
  });
}

export const StableID = {
  get: async (): Promise<string> => {
    if (stableID) {
      return stableID;
    }

    stableID = await getObjectFromStorage(STATSIG_STABLE_ID_KEY);
    if (!stableID) {
      stableID = getUUID();
      persistToStorage();
    }

    return stableID;
  },

  setOverride: (override: string): void => {
    stableID = override;
    persistToStorage();
  },
};
