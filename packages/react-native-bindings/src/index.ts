import AsyncStorage from '@react-native-async-storage/async-storage';

import { Storage } from '@statsig/client-core';

import './StatsigMetadataAdditions';

Storage.setProvider(AsyncStorage);

export {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
} from '@statsig/react-bindings';
