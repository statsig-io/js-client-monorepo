import { _getStorageKey } from './CacheKey';
import { Log } from './Log';
import { _getDocumentSafe } from './SafeJs';
import { _getObjectFromStorage, _setObjectInStorage } from './StorageProvider';
import { getUUID } from './UUID';

const PROMISE_MAP: Record<string, string> = {};
const COOKIE_ENABLED_MAP: Record<string, boolean> = {};
const DISABLED_MAP: Record<string, boolean> = {};

export const StableID = {
  cookiesEnabled: false,
  randomID: Math.random().toString(36),
  get: (sdkKey: string): string | null => {
    if (DISABLED_MAP[sdkKey]) {
      return null;
    }

    if (PROMISE_MAP[sdkKey] != null) {
      return PROMISE_MAP[sdkKey];
    }
    let stableID: string | null = null;
    stableID = _loadFromCookie(sdkKey);
    if (stableID != null) {
      PROMISE_MAP[sdkKey] = stableID;
      _persistToStorage(stableID, sdkKey);
      return stableID;
    }

    stableID = _loadFromStorage(sdkKey);

    if (stableID == null) {
      stableID = getUUID();
    }

    _persistToStorage(stableID, sdkKey);
    _persistToCookie(stableID, sdkKey);

    PROMISE_MAP[sdkKey] = stableID;
    return stableID;
  },

  setOverride: (override: string, sdkKey: string): void => {
    PROMISE_MAP[sdkKey] = override;
    _persistToStorage(override, sdkKey);
    _persistToCookie(override, sdkKey);
  },

  _setCookiesEnabled: (sdkKey: string, cookiesEnabled: boolean): void => {
    COOKIE_ENABLED_MAP[sdkKey] = cookiesEnabled;
  },

  _setDisabled: (sdkKey: string, disabled: boolean): void => {
    DISABLED_MAP[sdkKey] = disabled;
  },
};

function _getStableIDStorageKey(sdkKey: string): string {
  return `statsig.stable_id.${_getStorageKey(sdkKey)}`;
}

function _persistToStorage(stableID: string, sdkKey: string) {
  const storageKey = _getStableIDStorageKey(sdkKey);
  try {
    _setObjectInStorage(storageKey, stableID);
  } catch (e) {
    Log.warn('Failed to save StableID to storage');
  }
}

function _loadFromStorage(sdkKey: string): string | null {
  const storageKey = _getStableIDStorageKey(sdkKey);
  return _getObjectFromStorage<string>(storageKey);
}

function _loadFromCookie(sdkKey: string): string | null {
  if (!COOKIE_ENABLED_MAP[sdkKey] || _getDocumentSafe() == null) {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === getCookieName(sdkKey)) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function _persistToCookie(stableID: string, sdkKey: string) {
  if (!COOKIE_ENABLED_MAP[sdkKey] || _getDocumentSafe() == null) {
    return;
  }
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  document.cookie = `${getCookieName(sdkKey)}=${encodeURIComponent(stableID)}; expires=${expiryDate.toUTCString()}; path=/`;
}

export function getCookieName(sdkKey: string): string {
  return `statsig.stable_id.${_getStorageKey(sdkKey)}`;
}
