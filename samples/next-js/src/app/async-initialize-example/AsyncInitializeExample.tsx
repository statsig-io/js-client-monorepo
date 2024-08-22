'use client';

import { useContext } from 'react';

import {
  StatsigContext,
  StatsigProvider,
  useClientAsyncInit,
  useFeatureGate,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function Content() {
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
    </div>
  );
}

export default function AsyncInitializeExample(): JSX.Element {
  const { client, isLoading } = useClientAsyncInit(DEMO_CLIENT_KEY, {
    userID: 'a-user',
  });

  if (isLoading) {
    return <div>Statsig Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
