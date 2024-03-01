export type Visibility = 'foreground' | 'background';

type VisibilityChangeListener = {
  onVisibilityChanged: (visibility: Visibility) => void;
};

export class VisibilityChangeObserver {
  private static _listeners: VisibilityChangeListener[] = [];
  private static _current: Visibility | null = null;

  static isCurrentlyVisible(): boolean {
    return this._current === 'foreground';
  }

  static add(listener: VisibilityChangeListener): void {
    this._listeners.push(listener);
  }

  static remove(listener: VisibilityChangeListener): void {
    const index = this._listeners.indexOf(listener);

    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  static notify(visibility: Visibility): void {
    if (visibility === this._current) {
      return;
    }

    this._current = visibility;
    this._listeners.forEach((l) => l.onVisibilityChanged(visibility));
  }
}

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('blur', () =>
    VisibilityChangeObserver.notify('background'),
  );

  window.addEventListener('beforeunload', () =>
    VisibilityChangeObserver.notify('background'),
  );
}

if (
  typeof document !== 'undefined' &&
  typeof document.addEventListener === 'function'
) {
  document.addEventListener('visibilitychange', () => {
    VisibilityChangeObserver.notify(
      document.visibilityState === 'visible' ? 'foreground' : 'background',
    );
  });
}
