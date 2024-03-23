import { useMemo } from 'react';

import { StatsigMetadataProvider } from '@statsig/client-core';
import type { StatsigProviderWithCacheWarmingProps } from '@statsig/react-native-core';
import { StatsigProviderWithCacheWarming } from '@statsig/react-native-core';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

type Props = StatsigProviderWithCacheWarmingProps;

export function StatsigProviderExpo(props: Props): JSX.Element | null {
  useMemo(() => {
    StatsigMetadataProvider.add(GetStatsigMetadataAdditions());
  }, []);

  return StatsigProviderWithCacheWarming(props);
}
