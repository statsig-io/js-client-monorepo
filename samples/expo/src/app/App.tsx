import React from 'react';
import { SafeAreaView, StatusBar, Text } from 'react-native';

import { LogLevel } from '@statsig/client-core';
import {
  StatsigProviderExpo,
  useGate,
  warmCachingFromAsyncStorage,
} from '@statsig/expo-bindings';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';

export const DEMO_CLIENT_KEY =
  'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const client = new StatsigOnDeviceEvalClient(DEMO_CLIENT_KEY, {
  logLevel: LogLevel.Debug,
});
const warming = warmCachingFromAsyncStorage(client);

function Content(): React.ReactNode {
  const gate = useGate('a_gate', { user: { userID: 'a-user' } });

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <Text testID="test-text">
          a_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
        </Text>
      </SafeAreaView>
    </>
  );
}

export default function App(): React.ReactNode {
  return (
    <StatsigProviderExpo client={client} cacheWarming={warming}>
      <Content />
    </StatsigProviderExpo>
  );
}
