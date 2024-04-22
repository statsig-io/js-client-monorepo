import {
  _addDocumentEventListenerSafe,
  _addWindowEventListenerSafe,
} from './SafeJs';

const FOREGROUND = 'foreground';
const BACKGROUND = 'background';

export type Visibility = typeof FOREGROUND | typeof BACKGROUND;

type VisibilityChangedCallback = (visibility: Visibility) => void;

const LISTENERS: VisibilityChangedCallback[] = [];
let current: Visibility = FOREGROUND;

export const _isCurrentlyVisible = (): boolean => {
  return current === FOREGROUND;
};

export const _subscribeToVisiblityChanged = (
  listener: VisibilityChangedCallback,
): void => {
  LISTENERS.unshift(listener);
};

export const _notifyVisibilityChanged = (visibility: Visibility): void => {
  if (visibility === current) {
    return;
  }

  current = visibility;
  LISTENERS.forEach((l) => l(visibility));
};

_addWindowEventListenerSafe('focus', () =>
  _notifyVisibilityChanged(FOREGROUND),
);

_addWindowEventListenerSafe('blur', () => _notifyVisibilityChanged(BACKGROUND));

_addWindowEventListenerSafe('beforeunload', () =>
  _notifyVisibilityChanged(BACKGROUND),
);

_addDocumentEventListenerSafe('visibilitychange', () => {
  _notifyVisibilityChanged(
    document.visibilityState === 'visible' ? FOREGROUND : BACKGROUND,
  );
});
