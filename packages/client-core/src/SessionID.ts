import { DJB2 } from './Hashing';
import { Log } from './Log';
import { getObjectFromStorage, setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

type SessionData = {
  sessionID: string;
  startTime: number;
  lastUpdate: number;
};

const SESSION_ID_MAP: Record<string, SessionData> = {};
const MAX_SESSION_IDLE_TIME = 10 * 60 * 1000; // 10 minutes
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours

export const SessionID = {
  get: async (sdkKey: string): Promise<string> => {
    let session = SESSION_ID_MAP[sdkKey];
    if (session == null) {
      session = (await _loadFromStorage(sdkKey)) ?? {
        sessionID: getUUID(),
        startTime: Date.now(),
        lastUpdate: Date.now(),
      };
      SESSION_ID_MAP[sdkKey] = session;
    }
    if (
      Date.now() - session.startTime > MAX_SESSION_AGE ||
      Date.now() - session.lastUpdate > MAX_SESSION_IDLE_TIME
    ) {
      session.sessionID = getUUID();
      session.startTime = Date.now();
    }
    session.lastUpdate = Date.now();
    _persistToStorage(session, sdkKey);
    SESSION_ID_MAP[sdkKey] = session;
    return session.sessionID;
  },
};

function _getSessionIDStorageKey(sdkKey: string): string {
  return `statsig.session_id.${DJB2(sdkKey)}`;
}

function _persistToStorage(session: SessionData, sdkKey: string) {
  const storageKey = _getSessionIDStorageKey(sdkKey);

  setObjectInStorage(storageKey, session).catch(() => {
    Log.warn('Failed to save SessionID');
  });
}

function _loadFromStorage(sdkKey: string) {
  const storageKey = _getSessionIDStorageKey(sdkKey);
  return getObjectFromStorage<SessionData>(storageKey);
}
