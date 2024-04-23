export const _getWindowSafe = (): Window | null => {
  return typeof window !== 'undefined' ? window : null;
};

export const _getDocumentSafe = (): Document | null => {
  const win = _getWindowSafe();
  return win?.document ?? null;
};

export const _isBrowserEnv = (): boolean => {
  return _getDocumentSafe() != null;
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
