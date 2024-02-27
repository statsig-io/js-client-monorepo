import AsyncStorage from '@react-native-async-storage/async-storage';

import { Storage } from '@sigstat/core';

import './StatsigMetadataAdditions';

Storage.setProvider(AsyncStorage);

export {
  StatsigContext,
  StatsigProvider,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
} from '@sigstat/react-bindings';
