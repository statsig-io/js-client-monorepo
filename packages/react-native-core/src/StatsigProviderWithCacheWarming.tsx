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
  const [isWarmed, setIsWarmed] = useState(false);

  useEffect(() => {
    props.cacheWarming.result
      .catch((e) => {
        Log.error('An error occurred while warming the Statsig client', e);
      })
      .finally(() => {
        props.client.initializeSync();
        setIsWarmed(true);
      });
  }, [props.client, props.cacheWarming.result]);

  if (!isWarmed) {
    return null;
  }

  return <StatsigProvider {...props} />;
}
