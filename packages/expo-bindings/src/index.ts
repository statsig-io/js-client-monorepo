import '@react-native-async-storage/async-storage';

import {
  GetStatsigProviderWithCacheWarming,
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

export {
  StatsigContext,
  useGate,
  useDynamicConfig,
  useExperiment,
  useLayer,
} from '@statsig/react-bindings';

const StatsigProviderExpo = GetStatsigProviderWithCacheWarming(
  GetStatsigMetadataAdditions(),
);
export { StatsigProviderExpo, warmCachingFromAsyncStorage };
