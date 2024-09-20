/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable no-console */
// <snippet>
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  StatsigClientExpo,
  StatsigProviderExpo,
  useFeatureGate,
} from '@statsig/expo-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// <snippet>

function useStatsigExpoSetup() {
  const ref = useRef<StatsigClientExpo | null>(null);
  const [isLoadingLatestValues, setIsLoadingLatestValues] = useState(true);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  const client = useMemo(() => {
    if (ref.current) {
      return ref.current;
    }

    const client = new StatsigClientExpo(YOUR_CLIENT_KEY, { userID: 'a-user' });

    ref.current = client;

    client.storageProvider
      .isReadyResolver()
      ?.then(() => {
        setIsLoadingCache(false);
      })
      .catch(console.error);

    client
      .initializeAsync()
      .catch(console.error)
      .finally(() => {
        setIsLoadingLatestValues(false);
      });

    return client;
  }, []);

  return { client, isLoadingLatestValues, isLoadingCache };
}

function Content() {
  const gate = useFeatureGate('a_gate');

  return <Text>Reason: {gate.details.reason}</Text>; // Reason: Network or NetworkNotModified
}

export default function App() {
  const { client, isLoadingLatestValues, isLoadingCache } =
    useStatsigExpoSetup();

  const content = useMemo(() => {
    if (isLoadingCache) {
      return <Text>Loading cache...</Text>;
    }

    // Remove if you do not want to wait on latest values
    if (isLoadingLatestValues) {
      return <Text>Loading latest values...</Text>;
    }

    return (
      <StatsigProviderExpo client={client}>
        <Content />
      </StatsigProviderExpo>
    );
  }, [client, isLoadingCache, isLoadingLatestValues]);

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
// </snippet>
