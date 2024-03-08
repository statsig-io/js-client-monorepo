import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Text, View } from 'react-native';

import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';
import {
  StatsigProvider,
  useExperiment,
  useGate,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user);

function Content() {
  const gate = useGate('a_gate');
  const experiment = useExperiment('an_experiment');

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>Delayed Init Example</Text>
      <Text>PrecomputedEvaluationsClient status: {client.loadingStatus}</Text>
      <Text>
        a_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
      </Text>
      <Text>an_experiment: {JSON.stringify(experiment.value)}</Text>
      <Button
        title="Clear Cache"
        onPress={() => {
          AsyncStorage.clear().catch((err) => {
            alert(err.message);
          });
        }}
      />
    </View>
  );
}

export default function DelayedInitExample(): JSX.Element {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
