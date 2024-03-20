import '@react-native-async-storage/async-storage';

import './StatsigMetadataAdditions';

export {
  StatsigContext,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
} from '@statsig/react-bindings';

export {
  StatsigProviderRN as StatsigProviderExpo,
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';
