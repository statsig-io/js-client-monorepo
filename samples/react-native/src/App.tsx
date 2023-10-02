import { NativeBaseProvider } from 'native-base';
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import { StatsigProvider } from '@sigstat/react-native-bindings';

import ExamplesList from './ExamplesList';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, {
  userID: 'a-user',
});

export default function App(): React.ReactNode {
  return (
    <StatsigProvider client={client}>
      <NativeBaseProvider
        initialWindowMetrics={{
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <StatusBar hidden />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1F222A' }}>
          <ExamplesList />
        </SafeAreaView>
      </NativeBaseProvider>
    </StatsigProvider>
  );
}
