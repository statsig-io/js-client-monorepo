import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import {
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';
import {
  StatsigProvider,
  useExperiment,
  useGate,
} from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };

const adapter = new EvaluationsDataAdapter();
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user, {
  dataAdapter: adapter,
});

function Content() {
  const gate = useGate('a_gate');
  const experiment = useExperiment('an_experiment');

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>
        Precomputed Evaluations Example
      </Text>
      <Text>PrecomputedEvaluationsClient status: {client.loadingStatus}</Text>
      <Text>a_gate: {gate.value ? 'Pass' : 'Fail'}</Text>
      <Text>an_experiment: {JSON.stringify(experiment.value)}</Text>
    </View>
  );
}

export default function PrecomputedEvaluationsExample(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adapter
      .prefetchDataForUser(user)
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Text>...</Text>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
