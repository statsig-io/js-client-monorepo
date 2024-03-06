import { ReactNode } from 'react';

import {
  NetworkEvaluationsDataProvider,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';
import { StatsigProvider, useGate } from '@statsig/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';
const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, {
  dataProviders: [NetworkEvaluationsDataProvider.create()],
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

export default function HomePage(): ReactNode {
  return (
    <StatsigProvider
      client={client}
      user={{
        userID: 'a-user',
      }}
    >
      <Content />
    </StatsigProvider>
  );
}
