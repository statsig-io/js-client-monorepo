import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import { StatsigProvider } from '@sigstat/react-native-bindings';

import { AppStackParamList } from './AppStackParamList';
import ExamplesList from './ExamplesList';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, {
  userID: 'a-user',
});

type HomeProps = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen(_props: HomeProps): React.ReactNode {
  return (
    <StatsigProvider client={client}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#272935' }}>
        <ExamplesList />
      </SafeAreaView>
    </StatsigProvider>
  );
}
