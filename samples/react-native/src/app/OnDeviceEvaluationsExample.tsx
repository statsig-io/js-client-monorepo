import { Text, View } from 'react-native';

import { OnDeviceEvaluationsClient } from '@sigstat/on-device-evaluations';
import {
  StatsigProvider,
  useExperiment,
  useGate,
} from '@sigstat/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };
const client = new OnDeviceEvaluationsClient(DEMO_CLIENT_KEY);

function Content() {
  const gate = useGate('a_gate', { user });
  const experiment = useExperiment('an_experiment', { user });

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>On Device Evaluations Example</Text>
      <Text>OnDeviceEvaluationsClient status: {client.loadingStatus}</Text>
      <Text>a_gate: {gate.value ? 'Pass' : 'Fail'}</Text>
      <Text>an_experiment: {JSON.stringify(experiment.value)}</Text>
    </View>
  );
}

export default function OnDeviceEvaluationsExample(): JSX.Element {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
