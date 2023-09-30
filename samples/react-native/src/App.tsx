import '@react-native-async-storage/async-storage';
import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import { StatsigProvider, useGate } from '@sigstat/react-bindings';

const client = new PrecomputedEvaluationsClient('client-key', {
  userID: 'a-user',
});

function Content() {
  const { value } = useGate('a_gate');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        {value ? 'Passing' : 'Failing'}
      </Text>
    </View>
  );
}

export default function App(): React.ReactNode {
  return (
    <>
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#194b7d' }}>
        <StatsigProvider client={client}>
          <Content />
        </StatsigProvider>
      </SafeAreaView>
    </>
  );
}
