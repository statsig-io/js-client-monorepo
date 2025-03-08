declare let EdgeRuntime: unknown;
declare let process: { versions: { node: unknown } };

export const _getWindowSafe = (): Window | null => {
  return typeof window !== 'undefined' ? window : null;
};

export const _getDocumentSafe = (): Document | null => {
  const win = _getWindowSafe();
  return win?.document ?? null;
};

export const _isServerEnv = (): boolean => {
  if (_getDocumentSafe() !== null) {
    return false;
  }

  const isNode =
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;

  const isVercel = typeof EdgeRuntime === 'string';
  return isVercel || isNode;
};

export const _addWindowEventListenerSafe = (
  key: string,
  listener: () => void,
): void => {
  const win = _getWindowSafe();
  if (typeof win?.addEventListener === 'function') {
    win.addEventListener(key, listener);
  }
};

export const _addDocumentEventListenerSafe = (
  key: string,
  listener: () => void,
): void => {
  const doc = _getDocumentSafe();
  if (typeof doc?.addEventListener === 'function') {
    doc.addEventListener(key, listener);
  }
};

export const _getCurrentPageUrlSafe = (): string | undefined => {
  try {
    return _getWindowSafe()?.location.href.split(/[?#]/)[0];
  } catch {
    return;
  }
};

export const _getUnloadEvent = (): string => {
  const win = _getWindowSafe();
  if (!win) {
    return 'beforeunload';
  }
  const eventType = 'onpagehide' in win ? 'pagehide' : 'beforeunload';
  return eventType;
};
