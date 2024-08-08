import { useEffect } from 'react';

import { SDKType, StatsigMetadataProvider } from '@statsig/client-core';
import { StatsigProviderProps } from '@statsig/react-bindings';
import { StatsigProviderRNSyncStorage } from '@statsig/react-native-core';

import { GetStatsigMetadataAdditions } from './StatsigMetadataAdditions';

type Props = StatsigProviderProps;

export function StatsigProviderRN(props: Props): JSX.Element | null {
  useEffect(() => {
    SDKType._setBindingType('rn');
    StatsigMetadataProvider.add(GetStatsigMetadataAdditions());
  }, []);

  return StatsigProviderRNSyncStorage(props);
}
