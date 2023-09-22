import {
  getObjectFromLocalStorage,
  setObjectInLocalStorage,
} from '@statsig/core';

export const STORAGE_KEY = 'STATSIG_JS_LOCAL_OVERRIDES';

export function makeEmptyOverrides() {
  return { gates: {}, configs: {}, layers: {} };
}

export type LocalOverrides = {
  gates: { [gateName: string]: boolean };
  configs: { [configName: string]: Record<string, unknown> };
  layers: { [layerName: string]: Record<string, unknown> };
};

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

export function saveOverridesToLocalStorage(overrides: LocalOverrides) {
  setObjectInLocalStorage(STORAGE_KEY, overrides);
}
