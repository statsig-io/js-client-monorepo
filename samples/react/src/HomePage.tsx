import { ReactNode, useEffect, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useGateValue } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

const user = {
  userID: 'a-user',
};
const client = new StatsigClient(STATSIG_CLIENT_KEY, user);
client.initializeSync();

function Content() {
  const gateOn = useGateValue('a_gate');

  return (
    <div
      style={{
        fontSize: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      {gateOn ? 'Passing' : 'Failing'}
    </div>
  );
}

export default function HomePage(): ReactNode {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Todo: add ability to block render via StatsigProvider
    client
      .updateUserAsync(user)
      .catch((e) => {
        throw e;
      })
      .finally(() => {
        setIsLoading(false);
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
