import { DJB2 } from './Hashing';
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
const PROMISE_MAP: Record<string, Promise<StatsigSession>> = {};

export const SessionID = {
  get: async (sdkKey: string): Promise<string> => {
    return StatsigSession.get(sdkKey).then((x) => x.data.sessionID);
  },
};

export const StatsigSession = {
  get: async (sdkKey: string): Promise<StatsigSession> => {
    if (PROMISE_MAP[sdkKey] == null) {
      PROMISE_MAP[sdkKey] = _loadSession(sdkKey);
    }

    const session = await PROMISE_MAP[sdkKey];
    return _bumpSession(session);
  },
};

async function _loadSession(sdkKey: string): Promise<StatsigSession> {
  let data = await _loadFromStorage(sdkKey);
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

function _bumpSession(session: StatsigSession): StatsigSession {
  const now = Date.now();

  const data = session.data;
  if (_isIdle(data) || _hasRunTooLong(data)) {
    data.sessionID = getUUID();
    data.startTime = now;
  }

  data.lastUpdate = now;
  _persistToStorage(data, session.sdkKey);
  session.data = data;

  clearTimeout(session.idleTimeoutID);
  clearTimeout(session.ageTimeoutID);

  const lifetime = now - data.startTime;
  const sdkKey = session.sdkKey;

  return {
    data,
    sdkKey,
    // idleTimeoutID: _createSessionTimeout(sdkKey, MAX_SESSION_IDLE_TIME),
    ageTimeoutID: _createSessionTimeout(sdkKey, MAX_SESSION_AGE - lifetime),
  };
}

function _createSessionTimeout(
  sdkKey: string,
  duration: number,
): SessionTimeoutID {
  return setTimeout(() => {
    const client = __STATSIG__?.instance(sdkKey);
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
  return `statsig.session_id.${DJB2(sdkKey)}`;
}

function _persistToStorage(session: SessionData, sdkKey: string) {
  const storageKey = _getSessionIDStorageKey(sdkKey);

  _setObjectInStorage(storageKey, session).catch(() => {
    Log.warn('Failed to save SessionID');
  });
}

function _loadFromStorage(sdkKey: string) {
  const storageKey = _getSessionIDStorageKey(sdkKey);
  return _getObjectFromStorage<SessionData>(storageKey);
}
