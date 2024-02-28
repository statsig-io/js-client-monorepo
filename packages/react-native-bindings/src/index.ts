import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { Storage, VisibilityChangeObserver } from '@statsig/client-core';

import './StatsigMetadataAdditions';

Storage.setProvider(AsyncStorage);

AppState.addEventListener('change', (nextAppState) =>
  VisibilityChangeObserver.notify(
    nextAppState === 'active' ? 'foreground' : 'background',
  ),
);

export {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
} from '@statsig/react-bindings';
