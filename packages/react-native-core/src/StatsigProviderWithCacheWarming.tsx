import { useEffect, useState } from 'react';

import { Log } from '@statsig/client-core';
import { StatsigProvider, StatsigProviderProps } from '@statsig/react-bindings';

import { StatsigAsyncCacheWarming } from './AsyncStorageWarming';

export type StatsigProviderWithCacheWarmingProps = StatsigProviderProps & {
  cacheWarming: StatsigAsyncCacheWarming;
};

export function StatsigProviderWithCacheWarming(
  props: StatsigProviderWithCacheWarmingProps,
): JSX.Element | null {
  const [isWarmed, setIsWarmed] = useState(props.cacheWarming.isResolved);

  useEffect(() => {
    if (isWarmed) {
      if (props.client.loadingStatus === 'Uninitialized') {
        props.client.initializeSync();
      }
      return;
    }

    props.cacheWarming.result
      .catch((e) => {
        Log.error('Statig cache warming error', e);
      })
      .finally(() => {
        props.client.initializeSync();
        setIsWarmed(true);
      });
  }, [props.client, props.cacheWarming.result, isWarmed]);

  if (!isWarmed) {
    return null;
  }

  return <StatsigProvider {...props} />;
}
