import {
  getObjectFromLocalStorage,
  setObjectInLocalStorage,
} from '@statsig-client/core';

export const STORAGE_KEY = 'STATSIG_JS_LOCAL_OVERRIDES';

export type LocalOverrides = {
  gates: { [gateName: string]: boolean };
  configs: { [configName: string]: Record<string, unknown> };
  layers: { [layerName: string]: Record<string, unknown> };
};

export function makeEmptyOverrides(): LocalOverrides {
  return { gates: {}, configs: {}, layers: {} };
}

export function loadOverridesFromLocalStorage(): LocalOverrides {
  const raw = getObjectFromLocalStorage<LocalOverrides>(STORAGE_KEY);

  if (raw && 'gates' in raw) {
    try {
      return raw;
    } catch (error) {
      // noop
    }
  }

  return makeEmptyOverrides();
}

export function saveOverridesToLocalStorage(overrides: LocalOverrides): void {
  setObjectInLocalStorage(STORAGE_KEY, overrides);
}
