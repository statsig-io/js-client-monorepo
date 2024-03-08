// <snippet>
import { PrecomputedEvaluationsClient } from '@statsig/precomputed-evaluations';
import { StatsigProvider, useGate } from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
App();
}

// <snippet>
const myStatsigClient = new PrecomputedEvaluationsClient(YOUR_CLIENT_KEY, {
  userID: 'a-user',
});

function Content() {
  const gate = useGate('a_gate');

  return <div>a_gate: {gate.value ? 'Passing' : 'Failing'}</div>;
}

function App() {
  return (
    <StatsigProvider client={myStatsigClient}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
