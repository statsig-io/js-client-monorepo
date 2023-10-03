import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Box } from 'native-base';
import { EvaluationResponse } from 'packages/precomputed-evaluations/src/EvaluationData';
import React from 'react';
import { SafeAreaView } from 'react-native';

import {
  EvaluationDataProviderInterface,
  PrecomputedEvaluationsClient,
  StatsigOptions,
  StatsigUser,
} from '@sigstat/precomputed-evaluations';
import { StatsigProvider } from '@sigstat/react-native-bindings';

import { AppStackParamList } from './AppStackParamList';
import ExperimentHookExample from './ExperimentHookExample';
import GateHookExample from './GateHookExample';
import UpdateUserExample from './UpdateUserExample';

function makeEvaluationResponse(userID: string): EvaluationResponse {
  return {
    feature_gates: {
      '2867927529': {
        name: '2867927529',
        value: Math.random() < 0.5,
        rule_id: 'Example',
        id_type: 'userID',
        secondary_exposures: [],
      },
    },
    dynamic_configs: {
      '2902556896': {
        name: '2902556896',
        value: {
          str: `Hello ${userID}`,
        },
        rule_id: 'default',
        group: 'default',
        is_device_based: false,
        id_type: 'userID',
        secondary_exposures: [],
      },
    },
    layer_configs: {},
    has_updates: true,
    time: 1696281523652,
    hash_used: 'none',
  };
}

class EvalDataProvider implements EvaluationDataProviderInterface {
  fetchEvaluations(user: StatsigUser): EvaluationResponse | null {
    return makeEvaluationResponse(user.userID ?? 'N/A');
  }
}

const opts: StatsigOptions = { evaluationDataProvider: new EvalDataProvider() };

const client = new PrecomputedEvaluationsClient(
  'client-key',
  {
    userID: 'a-user',
  },
  opts,
);

type BootstrapProps = NativeStackScreenProps<AppStackParamList, 'Bootstrap'>;

export default function BootstrapExampleScreen(
  _p: BootstrapProps,
): React.ReactNode {
  return (
    <StatsigProvider client={client}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#272935' }}>
        <Box padding="16px">
          <ExperimentHookExample experimentName={'a_config'} />
          <GateHookExample gateName={'a_gate'} />
          <UpdateUserExample />
        </Box>
      </SafeAreaView>
    </StatsigProvider>
  );
}
