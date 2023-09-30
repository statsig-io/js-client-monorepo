import '@react-native-async-storage/async-storage';

import '@sigstat/client-extensions';
import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';
import { StatsigProvider, useExperiment } from '@sigstat/react-bindings';

const client = new PrecomputedEvaluationsClient('client-key', {
  userID: 'a-user',
});

client.overrideGate('overridden_gate', true);
client.overrideExperiment('overridden_experiment', {
  a_string: 'overridden_string',
});

function Content() {
  const { experiment } = useExperiment('overridden_experiment');

  return (
    <div
      style={{
        fontSize: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      overridden_experiment: {JSON.stringify(experiment.value)}
    </div>
  );
}

export default function LocalOverridesExample(): React.ReactNode {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
