import { _getStorageKey } from './CacheKey';
import { Log } from './Log';
import { _getObjectFromStorage, _setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';
import { _subscribeToVisiblityChanged } from './VisibilityObserving';

type SessionData = {
  sessionID: string;
  startTime: number;
  lastUpdate: number;
};

export type StatsigSession = {
  data: SessionData;
  sdkKey: string;
  lastPersistedAt: number;
  storageKey: string;
};

const MAX_SESSION_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_AGE = 4 * 60 * 60 * 1000; // 4 hours
const PERSIST_THROTTLE_MS = 15_000;

const SESSION_MAP: Record<string, StatsigSession> = {};

_subscribeToVisiblityChanged((visibility) => {
  if (visibility === 'background') {
    Object.values(SESSION_MAP).forEach((session) => _persistNow(session));
  }
});

export const SessionID = {
  get: (sdkKey: string): string => {
    return StatsigSession.get(sdkKey).data.sessionID;
  },
};

export const StatsigSession = {
  get: (sdkKey: string, bumpSession = true): StatsigSession => {
    if (SESSION_MAP[sdkKey] == null) {
      SESSION_MAP[sdkKey] = _loadOrCreateSharedSession(sdkKey);
    }

    const session = SESSION_MAP[sdkKey];
    return _maybeBumpSession(session, bumpSession);
  },

  overrideInitialSessionID: (override: string, sdkKey: string): void => {
    const now = Date.now();

    const session: StatsigSession = {
      data: {
        sessionID: override,
        startTime: now,
        lastUpdate: now,
      },
      sdkKey,
      lastPersistedAt: Date.now(),
      storageKey: _getSessionIDStorageKey(sdkKey),
    };
    _persistNow(session);
    SESSION_MAP[sdkKey] = session;
  },

  checkForIdleSession: (sdkKey: string): void => {
    const session = SESSION_MAP[sdkKey];
    if (!session) {
      return;
    }
    const sessionExpired = _checkForExpiredSession(session);
    if (sessionExpired) {
      _persistNow(session);
    }
  },
};

function _maybeBumpSession(
  session: StatsigSession,
  allowSessionBump: boolean,
): StatsigSession {
  const now = Date.now();

  const sessionExpired = _checkForExpiredSession(session);

  if (sessionExpired) {
    _persistNow(session);
  } else if (allowSessionBump) {
    session.data.lastUpdate = now;
    _persistThrottled(session);
  }

  return session;
}

function _checkForExpiredSession(session: StatsigSession): boolean {
  const data = session.data;
  const sessionExpired = _isIdle(data) || _hasRunTooLong(data);
  if (sessionExpired) {
    session.data = _newSessionData();

    __STATSIG__?.instance(session.sdkKey)?.$emt({ name: 'session_expired' });
  }
  return sessionExpired;
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

function _persistNow(session: StatsigSession) {
  try {
    _setObjectInStorage(session.storageKey, session.data);
    session.lastPersistedAt = Date.now();
  } catch (e) {
    Log.warn('Failed to save SessionID');
  }
}

function _persistThrottled(session: StatsigSession): void {
  const now = Date.now();
  if (now - session.lastPersistedAt > PERSIST_THROTTLE_MS) {
    _persistNow(session);
  }
}

function _loadSessionFromStorage(storageKey: string) {
  const data = _getObjectFromStorage<SessionData>(storageKey);
  return data;
}

function _loadOrCreateSharedSession(sdkKey: string): StatsigSession {
  const storageKey = _getSessionIDStorageKey(sdkKey);
  const existing = _loadSessionFromStorage(storageKey);

  if (
    existing &&
    existing.sessionID &&
    existing.startTime &&
    existing.lastUpdate
  ) {
    return { data: existing, sdkKey, lastPersistedAt: 0, storageKey };
  }

  return {
    data: _newSessionData(),
    sdkKey,
    lastPersistedAt: 0,
    storageKey,
  };
}

function _newSessionData(): SessionData {
  return {
    sessionID: getUUID(),
    startTime: Date.now(),
    lastUpdate: Date.now(),
  };
}
