import '@react-native-async-storage/async-storage';

import '@sigstat/client-extensions';
import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import {
  StatsigProvider,
  useExperiment,
  useGate,
} from '@sigstat/react-bindings';

const client = new PrecomputedEvaluationsClient('client-key', {
  userID: 'a-user',
});

client.overrideGate('overridden_gate', true);
client.overrideExperiment('overridden_experiment', {
  a_string: 'overridden_string',
});

function Text({ value }: { value: string }) {
  return (
    <div
      style={{
        fontSize: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      {value}
    </div>
  );
}

function CheckGate() {
  const { value } = useGate('overridden_gate');
  return <Text value={`overridden_gate: ${value ? 'Pass' : 'Fail'}`} />;
}

function GetExperiment() {
  const experiment = useExperiment('overridden_experiment');

  return (
    <Text
      value={`overridden_experiment: ${JSON.stringify(experiment.value)}`}
    />
  );
}

export default function LocalOverridesExample(): React.ReactNode {
  return (
    <StatsigProvider client={client}>
      <CheckGate />
      <GetExperiment />
    </StatsigProvider>
  );
}
