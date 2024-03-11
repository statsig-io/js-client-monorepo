import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

import {
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';
import { StatsigProvider } from '@statsig/react-bindings';
import { useExperiment, useGate } from '@statsig/react-native-bindings';

import { DEMO_CLIENT_KEY } from './Constants';

const user = { userID: 'a-user' };
const dataAdapter = new EvaluationsDataAdapter();
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user, {
  dataAdapter,
});
client.initializeSync();

const prefetching = dataAdapter.prefetchDataForUser(user);

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
            throw err;
          });
        }}
      />
    </View>
  );
}

export default function DelayedInitExample(): JSX.Element {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    prefetching
      .then(() => {
        client.updateUserSync(user);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  if (!isReady) {
    return <Text>...</Text>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
