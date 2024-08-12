import { useEffect } from 'react';

import { SDKType, StatsigMetadataProvider } from '@statsig/client-core';
import type { StatsigProviderWithCacheWarmingProps } from '@statsig/react-native-core';
import { StatsigProviderWithCacheWarming } from '@statsig/react-native-core';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

type Props = StatsigProviderWithCacheWarmingProps;

export function StatsigProviderRN(props: Props): JSX.Element | null {
  useEffect(() => {
    SDKType._setBindingType('rn');
    StatsigMetadataProvider.add(GetStatsigMetadataAdditions());
  }, []);

  return StatsigProviderWithCacheWarming(props);
}
