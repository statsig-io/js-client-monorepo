'use client';

import { useEffect, useState } from 'react';
import { StatsigUser } from 'statsig-node';

import {
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';
import { StatsigProvider, useGate } from '@statsig/react-bindings';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

function Content() {
  const { value } = useGate('a_gate');
  return (
    <div style={{ padding: 16 }}>a_gate: {value ? 'Passing' : 'Failing'}</div>
  );
}

export default function ClientApp({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): JSX.Element {
  const [client] = useState(
    new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, user),
  );

  useEffect(() => {
    const adapter = client.getDataAdapter() as EvaluationsDataAdapter;
    adapter.setDataForUser(user, values);
  }, [client, user, values]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
