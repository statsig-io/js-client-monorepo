import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';
import { GetStatsigProviderWithCacheWarming } from './StatsigProviderWithCacheWarming';

export * from './AsyncStorageWarming';

const StatsigProviderRN = GetStatsigProviderWithCacheWarming(
  GetStatsigMetadataAdditions(),
);
export { StatsigProviderRN, GetStatsigProviderWithCacheWarming };

export {
  StatsigContext,
  useDynamicConfig,
  useExperiment,
  useGate,
  useLayer,
} from '@statsig/react-bindings';
