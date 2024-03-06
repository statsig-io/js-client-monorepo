import { getUUID } from './UUID';

const SESSION_ID_MAP: Record<string, string> = {};

export const SessionID = {
  get: (sdkKey: string): string => {
    if (SESSION_ID_MAP[sdkKey] == null) {
      SESSION_ID_MAP[sdkKey] = getUUID();
    }

    return SESSION_ID_MAP[sdkKey];
  },
};
