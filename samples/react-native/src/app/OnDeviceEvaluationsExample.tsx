import { Text, View } from 'react-native';

import {
  StatsigOnDeviceEvalClientRN,
  StatsigProviderOnDeviceEvalRN,
  useExperiment,
  useFeatureGate,
} from '@statsig/react-native-bindings-on-device-eval';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };

const client = new StatsigOnDeviceEvalClientRN(DEMO_CLIENT_KEY);

function Content() {
  const gate = useFeatureGate('a_gate', user);
  const experiment = useExperiment('an_experiment', user);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>On Device Evaluations Example</Text>
      <Text>StatsigOnDeviceEvalClient status: {client.loadingStatus}</Text>
      <Text>
        a_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
      </Text>
      <Text>an_experiment: {JSON.stringify(experiment.value)}</Text>
    </View>
  );
}

export default function OnDeviceEvaluationsExample(): JSX.Element {
  return (
    <StatsigProviderOnDeviceEvalRN client={client}>
      <Content />
    </StatsigProviderOnDeviceEvalRN>
  );
}
