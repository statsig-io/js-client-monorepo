import StatsigProvider from 'packages/react-bindings/src/StatsigProvider';

import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

const client = new PrecomputedEvaluationsClient('client-key', {
  userID: 'a-user',
});

export function App() {
  return (
    <StatsigProvider client={client}>
      <div>
        <h1>
          <span> Hello there, </span>
          Welcome react-sample 👋
        </h1>
      </div>
    </StatsigProvider>
  );
}

export default App;
