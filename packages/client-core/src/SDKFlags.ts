const FLAGMAP: Record<string, Record<string, boolean>> = {};

export const SDKFlags = {
  setFlags: (sdkKey: string, flags: Record<string, boolean>): void => {
    FLAGMAP[sdkKey] = flags;
  },

  get: (sdkKey: string, flagKey: string): boolean => {
    return FLAGMAP[sdkKey]?.[flagKey] ?? false;
  },
};
