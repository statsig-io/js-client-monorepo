'use client';

import { useState } from 'react';

import {
  EvaluationResponse,
  LocalEvaluationDataProvider,
  PrecomputedEvaluationsClient,
} from '@sigstat/precomputed-evaluations';
import { StatsigProvider, useGate } from '@sigstat/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

function Content() {
  const { value } = useGate('a_gate');
  return <>a_gate: {value ? 'Passing' : 'Failing'}</>;
}

export default function ClientApp({
  values,
}: {
  values: EvaluationResponse;
}): JSX.Element {
  const [client] = useState(
    new PrecomputedEvaluationsClient(
      DEMO_CLIENT_KEY,
      { userID: 'a-user' },
      {
        evaluationDataProvider: new LocalEvaluationDataProvider({
          'a-user': values,
        }),
      },
    ),
  );

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
