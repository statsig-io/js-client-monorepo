import { _getStatsigGlobal } from './$_StatsigGlobal';
import { _getStorageKey } from './CacheKey';
import { Log } from './Log';
import { _getObjectFromStorage, _setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

type SessionTimeoutID = ReturnType<typeof setTimeout>;

type SessionData = {
  sessionID: string;
  startTime: number;
  lastUpdate: number;
};

export type StatsigSession = {
  data: SessionData;
  sdkKey: string;
  ageTimeoutID?: SessionTimeoutID;
  idleTimeoutID?: SessionTimeoutID;
};

const MAX_SESSION_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours
const PROMISE_MAP: Record<string, StatsigSession> = {};

export const SessionID = {
  get: (sdkKey: string): string => {
    return StatsigSession.get(sdkKey).data.sessionID;
  },
};

export const StatsigSession = {
  get: (sdkKey: string, bumpSession = true): StatsigSession => {
    if (PROMISE_MAP[sdkKey] == null) {
      PROMISE_MAP[sdkKey] = _loadSession(sdkKey);
    }

    const session = PROMISE_MAP[sdkKey];
    return bumpSession ? _bumpSession(session) : session;
  },

  overrideInitialSessionID: (override: string, sdkKey: string): void => {
    PROMISE_MAP[sdkKey] = _overrideSessionId(override, sdkKey);
  },
};

function _loadSession(sdkKey: string): StatsigSession {
  let data = _loadFromStorage(sdkKey);
  const now = Date.now();
  if (!data) {
    data = {
      sessionID: getUUID(),
      startTime: now,
      lastUpdate: now,
    };
  }

  return {
    data,
    sdkKey,
  };
}

function _overrideSessionId(override: string, sdkKey: string): StatsigSession {
  const now = Date.now();
  return {
    data: {
      sessionID: override,
      startTime: now,
      lastUpdate: now,
    },
    sdkKey,
  };
}

function _bumpSession(session: StatsigSession): StatsigSession {
  const now = Date.now();

  const data = session.data;
  const sdkKey = session.sdkKey;
  const sessionExpired = _isIdle(data) || _hasRunTooLong(data);
  if (sessionExpired) {
    data.sessionID = getUUID();
    data.startTime = now;
  }

  data.lastUpdate = now;
  _persistToStorage(data, session.sdkKey);

  clearTimeout(session.idleTimeoutID);
  clearTimeout(session.ageTimeoutID);

  const lifetime = now - data.startTime;

  session.idleTimeoutID = _createSessionTimeout(sdkKey, MAX_SESSION_IDLE_TIME);
  session.ageTimeoutID = _createSessionTimeout(
    sdkKey,
    MAX_SESSION_AGE - lifetime,
  );

  if (sessionExpired) {
    __STATSIG__?.instance(sdkKey)?.$emt({ name: 'session_expired' });
  }

  return session;
}

function _createSessionTimeout(
  sdkKey: string,
  duration: number,
): SessionTimeoutID {
  return setTimeout(() => {
    const client = _getStatsigGlobal()?.instance(sdkKey);
    if (client) {
      client.$emt({ name: 'session_expired' });
    }
  }, duration);
}

function _isIdle({ lastUpdate }: SessionData): boolean {
  return Date.now() - lastUpdate > MAX_SESSION_IDLE_TIME;
}

function _hasRunTooLong({ startTime }: SessionData): boolean {
  return Date.now() - startTime > MAX_SESSION_AGE;
}

function _getSessionIDStorageKey(sdkKey: string): string {
  return `statsig.session_id.${_getStorageKey(sdkKey)}`;
}

function _persistToStorage(session: SessionData, sdkKey: string) {
  const storageKey = _getSessionIDStorageKey(sdkKey);
  try {
    _setObjectInStorage(storageKey, session);
  } catch (e) {
    Log.warn('Failed to save SessionID');
  }
}

function _loadFromStorage(sdkKey: string) {
  const storageKey = _getSessionIDStorageKey(sdkKey);
  return _getObjectFromStorage<SessionData>(storageKey);
}
