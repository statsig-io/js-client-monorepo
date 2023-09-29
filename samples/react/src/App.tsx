import StatsigProvider from 'packages/react-sdk/src/StatsigProvider';

import { PrecomputedEvalutationsClient } from '@sigstat/precomputed-evaluations';

const client = new PrecomputedEvalutationsClient('client-key', {
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
