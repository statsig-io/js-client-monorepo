import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { Log, Storage, VisibilityChangeObserver } from '@statsig/client-core';
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

export function StatsigProviderRN(props: Props): JSX.Element {
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
