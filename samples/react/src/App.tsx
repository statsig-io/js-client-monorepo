import StatsigProvider from 'packages/react-bindings/src/StatsigProvider';
import useGate from 'packages/react-bindings/src/useGate';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

const client = new PrecomputedEvaluationsClient('client-key', {
  userID: 'a-user',
});

function Content() {
  const { value } = useGate('a_gate');

  return (
    <div
      style={{
        fontSize: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      {value ? 'Passing' : 'Failing'}
    </div>
  );
}

export function App() {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}

export default App;
