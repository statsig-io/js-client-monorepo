import { getObjectFromStorage, setObjectInStorage } from '@sigstat/core';

export const STORAGE_KEY = 'STATSIG_JS_LOCAL_OVERRIDES';

export type LocalOverrides = {
  gates: { [gateName: string]: boolean };
  configs: { [configName: string]: Record<string, unknown> };
  layers: { [layerName: string]: Record<string, unknown> };
};

export function makeEmptyOverrides(): LocalOverrides {
  return { gates: {}, configs: {}, layers: {} };
}

export async function loadOverridesFromLocalStorage(): Promise<LocalOverrides> {
  const raw = await getObjectFromStorage<LocalOverrides>(STORAGE_KEY);

  if (raw && 'gates' in raw) {
    try {
      return raw;
    } catch (error) {
      // noop
    }
  }

  return makeEmptyOverrides();
}

export async function saveOverridesToLocalStorage(
  overrides: LocalOverrides,
): Promise<void> {
  await setObjectInStorage(STORAGE_KEY, overrides);
}
