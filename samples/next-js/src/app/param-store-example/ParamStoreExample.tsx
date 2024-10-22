'use client';

import { useEffect } from 'react';

import { AnyStatsigClientEvent } from '@statsig/client-core';
import {
  StatsigProvider,
  useClientAsyncInit,
  useParameterStore,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

function ResultRow({ title, result }: { title: string; result: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {title}
      <pre style={{ display: 'inline', marginLeft: 8 }}>{result}</pre>
    </div>
  );
}

function Content() {
  const store = useParameterStore('a_param_store');
  const noExposureStore = useParameterStore('a_param_store', {
    disableExposureLog: true,
  });

  return (
    <div style={{ padding: 16 }}>
      <ResultRow
        title="a_string_param"
        result={store.get('a_string_param', 'fallback')}
      />

      <ResultRow
        title="a_bool_param"
        result={store.get('a_bool_param', false) ? 'Yes' : 'No'}
      />

      <ResultRow
        title="a_num_param"
        result={String(store.get('a_num_param', -1))}
      />

      <ResultRow
        title="a_string_param (No Exposure)"
        result={noExposureStore.get('a_string_param', 'fallback')}
      />

      <ResultRow
        title="my_failing_gated_value_boolean"
        result={
          store.get('my_failing_gated_value_boolean', false) ? 'Yes' : 'No'
        }
      />
    </div>
  );
}

export default function ParamStoreExample(): JSX.Element {
  const { client, isLoading } = useClientAsyncInit(DEMO_CLIENT_KEY, {
    userID: 'a-user',
  });

  useEffect(() => {
    const onAnyClientEvent = (event: AnyStatsigClientEvent) =>
      console.log(event);
    client.on('*', onAnyClientEvent);
    return () => client.off('*', onAnyClientEvent);
  }, [client]);

  if (isLoading) {
    return <div>Statsig Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
