import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  Log,
  StatsigMetadataProvider,
  Storage,
  VisibilityChangeObserver,
} from '@statsig/client-core';
import { StatsigProvider, StatsigProviderProps } from '@statsig/react-bindings';

import { StatsigAsyncCacheWarming } from './AsyncStorageWarming';

type Props = StatsigProviderProps & {
  cacheWarming: StatsigAsyncCacheWarming;
};

Storage.setProvider({
  ...AsyncStorage,
  getProviderName: () => 'AsyncStorage',
});

AppState.addEventListener('change', (nextAppState) =>
  VisibilityChangeObserver.notify(
    nextAppState === 'active' ? 'foreground' : 'background',
  ),
);

export function GetStatsigProviderWithCacheWarming(additions: {
  [key: string]: string | undefined;
}): (props: Props) => JSX.Element {
  StatsigMetadataProvider.add(additions);
  return StatsigProviderWithCacheWarming;
}

function StatsigProviderWithCacheWarming(props: Props): JSX.Element {
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
  }, [props.cacheWarming.result]);

  if (!isWarmed) {
    return <></>;
  }

  return <StatsigProvider {...props} />;
}
