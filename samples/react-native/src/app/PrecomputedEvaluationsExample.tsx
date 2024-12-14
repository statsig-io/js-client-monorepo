import * as React from 'react';
import { Text, View } from 'react-native';

import {
  StatsigClientRN,
  StatsigProviderRN,
  useExperiment,
  useFeatureGate,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };

const client = new StatsigClientRN(DEMO_CLIENT_KEY, user);

function Content() {
  const gate = useFeatureGate('a_gate');
  const experiment = useExperiment('an_experiment');

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>
        Precomputed Evaluations Example
      </Text>
      <Text>StatsigClient status: {client.loadingStatus}</Text>
      <Text>
        a_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
      </Text>
      <Text>an_experiment: {JSON.stringify(experiment.value)}</Text>
    </View>
  );
}

export default function PrecomputedEvaluationsExample(): React.ReactElement {
  return (
    <StatsigProviderRN client={client}>
      <Content />
    </StatsigProviderRN>
  );
}
