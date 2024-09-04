import { AppState } from 'react-native';

import { _notifyVisibilityChanged } from '@statsig/client-core';

let isApplied = false;
export function _applyAppStateVisibilityShim(): void {
  if (isApplied) {
    return;
  }

  isApplied = true;
  AppState.addEventListener('change', (nextAppState) =>
    _notifyVisibilityChanged(
      nextAppState === 'active' ? 'foreground' : 'background',
    ),
  );
}
