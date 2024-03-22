import { useMemo } from 'react';
import { Button, Text, View } from 'react-native';

import { Storage } from '@statsig/client-core';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';
import {
  StatsigProviderRN,
  useGate,
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from '../Constants';
import BootstrapValues from '../dcs_response.json';

type Props = {
  onBackPress: () => void;
};

function Content() {
  const gate = useGate('a_gate', { user: { userID: 'a-user' } });
  return (
    <Text>
      a_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason}){' '}
    </Text>
  );
}

export function RNBootstrapExample({ onBackPress }: Props): React.ReactNode {
  const onClearCachePress = () => {
    Storage.getAllKeys()
      .then((keys) => keys.map((key) => Storage.removeItem(key)))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
  };

  const { client, warming } = useMemo(() => {
    const client = new StatsigOnDeviceEvalClient(DEMO_CLIENT_KEY);
    client.dataAdapter.setData(JSON.stringify(BootstrapValues));

    const warming = warmCachingFromAsyncStorage(client);

    return { client, warming };
  }, []);

  return (
    <StatsigProviderRN client={client} cacheWarming={warming}>
      <View>
        <Button title="Back" onPress={onBackPress}></Button>
        <Button title="Clear Cache" onPress={onClearCachePress}></Button>
        <Content />
      </View>
    </StatsigProviderRN>
  );
}
