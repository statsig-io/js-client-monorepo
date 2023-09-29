import { getUUID } from '@sigstat/core';
import { PrecomputedEvalutationsClient } from '@sigstat/precomputed-evaluations';
import StatsigProvider from 'packages/react-sdk/src/StatsigProvider';
import { useEffect } from 'react';

const client = new PrecomputedEvalutationsClient('client-key', {
  userID: 'a-user',
});

export function App() {
  useEffect(() => {
    alert('Result: ' + getUUID());
  }, []);

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
