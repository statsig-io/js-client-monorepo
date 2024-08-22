import { ReactNode } from 'react';

import {
  StatsigProvider,
  useClientAsyncInit,
  useGateValue,
} from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY } from './Contants';

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
  const { client, isLoading } = useClientAsyncInit(STATSIG_CLIENT_KEY, {
    userID: 'a-user',
  });

  if (isLoading) {
    return <>Loading...</>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
