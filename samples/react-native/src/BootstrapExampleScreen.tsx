import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Box, Text } from 'native-base';
import React from 'react';
import { SafeAreaView } from 'react-native';

import {
  BootstrapEvaluationsDataProvider,
  EvaluationResponse,
  PrecomputedEvaluationsClient,
  StatsigOptions,
  StatsigUser,
} from '@sigstat/precomputed-evaluations';
import { StatsigProvider } from '@sigstat/react-native-bindings';

import { AppStackParamList } from './AppStackParamList';
import DynamicConfigHookExample from './DynamicConfigHookExample';
import UpdateUserExample from './UpdateUserExample';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';
const user: StatsigUser = { userID: 'a-user' };

const bundledFile =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./assets/boostrap-data.json') as EvaluationResponse;

const bootstrapProvider = new BootstrapEvaluationsDataProvider();
bootstrapProvider.addDataForUser(
  DEMO_CLIENT_KEY,
  user,
  JSON.stringify(bundledFile),
);

const opts: StatsigOptions = { dataProviders: [bootstrapProvider] };
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user, opts);

type BootstrapProps = NativeStackScreenProps<
  AppStackParamList,
  'BundledBootstrap'
>;

function Content() {
  return (
    <Box padding="16px">
      <Text fontSize="md" color="white">
        Status: {client.loadingStatus}
      </Text>
      <DynamicConfigHookExample configName={'a_dynamic_config'} />
      <UpdateUserExample />
    </Box>
  );
}

export default function BootstrapExampleScreen(
  _p: BootstrapProps,
): React.ReactNode {
  return (
    <StatsigProvider client={client}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#272935' }}>
        <Content />
      </SafeAreaView>
    </StatsigProvider>
  );
}
