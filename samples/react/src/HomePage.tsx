import { ReactNode, useEffect, useState } from 'react';

import {
  EvaluationsDataAdapter,
  PrecomputedEvaluationsClient,
} from '@statsig/precomputed-evaluations';
import { StatsigProvider, useGate } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

const user = {
  userID: 'a-user',
};
const adapter = new EvaluationsDataAdapter();
const client = new PrecomputedEvaluationsClient(STATSIG_CLIENT_KEY, user, {
  dataAdapter: adapter,
});

const fetchLatest = adapter.getData(user)
  ? null
  : adapter.fetchLatestDataForUser(user);

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
  const [isLoading, setIsLoading] = useState(fetchLatest != null);

  useEffect(() => {
    fetchLatest
      ?.then(() => {
        client.updateUser(user);
        setIsLoading(false);
      })
      .catch((e) => {
        throw e;
      });
  }, []);

  if (isLoading) {
    return <>...</>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
