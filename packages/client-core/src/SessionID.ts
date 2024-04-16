import { DJB2 } from './Hashing';
import { Log } from './Log';
import { getObjectFromStorage, setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

type SessionData = {
  sessionID: string;
  startTime: number;
  lastUpdate: number;
};

type SessionState = {
  emitFunction: () => void;
  ageTimeoutID: ReturnType<typeof setTimeout> | null;
  idleTimeoutID: ReturnType<typeof setTimeout> | null;
};

const SESSION_ID_MAP: Record<string, SessionData> = {};
const SESSION_STATE_MAP: Record<string, SessionState> = {};
const PROMISE_MAP: Record<string, Promise<string> | null> = {};
const MAX_SESSION_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours

export const SessionID = {
  get: async (sdkKey: string): Promise<string> => {
    if (PROMISE_MAP[sdkKey] != null) {
      return PROMISE_MAP[sdkKey] as Promise<string>;
    }
    return (PROMISE_MAP[sdkKey] = SessionID._getPromise(sdkKey));
  },
  _getPromise: async (sdkKey: string): Promise<string> => {
    let session = SESSION_ID_MAP[sdkKey];
    const now = Date.now();

    if (session == null) {
      let tempSession = await _loadFromStorage(sdkKey);
      if (tempSession == null) {
        tempSession = {
          sessionID: getUUID(),
          startTime: now,
          lastUpdate: now,
        };
      }
      session = tempSession;
      SESSION_ID_MAP[sdkKey] = session;
    }

    const sessionState = SESSION_STATE_MAP[sdkKey] ?? {
      ageTimeoutID: null,
      idleTimeoutID: null,
      emitFunction: () => {
        return;
      },
    };

    if (
      now - session.startTime > MAX_SESSION_AGE ||
      now - session.lastUpdate > MAX_SESSION_IDLE_TIME
    ) {
      session.sessionID = getUUID();
      session.startTime = now;
    }

    session.lastUpdate = now;
    _persistToStorage(session, sdkKey);

    sessionState.idleTimeoutID = SessionID._resetTimeout(
      sessionState,
      sessionState.idleTimeoutID,
      MAX_SESSION_IDLE_TIME,
    );

    sessionState.ageTimeoutID = SessionID._resetTimeout(
      sessionState,
      sessionState.ageTimeoutID,
      MAX_SESSION_AGE - (now - session.startTime),
    );
    SESSION_ID_MAP[sdkKey] = session;
    SESSION_STATE_MAP[sdkKey] = sessionState;
    PROMISE_MAP[sdkKey] = null;
    return session.sessionID;
  },
  _setEmitFunction: (eFunction: () => void, sdkKey: string): void => {
    const sessionState = SESSION_STATE_MAP[sdkKey] ?? {
      ageTimeoutID: null,
      idleTimeoutID: null,
      emitFunction: eFunction,
    };
    sessionState.emitFunction = eFunction;
    SESSION_STATE_MAP[sdkKey] = sessionState;
  },
  _resetTimeout: (
    sessionState: SessionState,
    timeoutID: ReturnType<typeof setTimeout> | null,
    duration: number,
  ): ReturnType<typeof setTimeout> | null => {
    clearTimeout(timeoutID ?? undefined);
    return setTimeout(sessionState.emitFunction, duration);
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
