import { Text, View } from 'react-native';

import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';
import {
  StatsigProviderRN,
  useExperiment,
  useGate,
  warmCachingFromAsyncStorage,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };

const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user);
const warming = warmCachingFromAsyncStorage(client);

function Content() {
  const gate = useGate('a_gate');
  const experiment = useExperiment('an_experiment');

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>
        Precomputed Evaluations Example
      </Text>
      <Text>PrecomputedEvaluationsClient status: {client.loadingStatus}</Text>
      <Text>
        a_gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
      </Text>
      <Text>an_experiment: {JSON.stringify(experiment.value)}</Text>
    </View>
  );
}

export default function PrecomputedEvaluationsExample(): JSX.Element {
  return (
    <StatsigProviderRN client={client} cacheWarming={warming}>
      <Content />
    </StatsigProviderRN>
  );
}
