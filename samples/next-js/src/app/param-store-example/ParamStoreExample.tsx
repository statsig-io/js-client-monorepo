'use client';

import { useEffect } from 'react';
import { StatsigUser } from 'statsig-node';

import { AnyStatsigClientEvent } from '@statsig/client-core';
import {
  StatsigProvider,
  useClientBootstrapInit,
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
  const store = useParameterStore('my_param_store');
  const noExposureStore = useParameterStore('my_param_store', {
    disableExposureLog: true,
  });

  return (
    <div style={{ padding: 16 }}>
      <ResultRow
        title="my_static_value_string"
        result={store.get('my_static_value_string', 'fallback')}
      />

      <ResultRow
        title="my_gated_value_boolean"
        result={store.get('my_gated_value_boolean', false) ? 'Yes' : 'No'}
      />

      <ResultRow
        title="my_gated_value_string"
        result={store.get('my_gated_value_string', 'fallback')}
      />

      <ResultRow
        title="my_gated_value_string (No Exposure)"
        result={noExposureStore.get('my_gated_value_string', 'fallback')}
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

export default function ParamStoreExample({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): JSX.Element {
  const client = useClientBootstrapInit(DEMO_CLIENT_KEY, user, values);

  useEffect(() => {
    const onAnyClientEvent = (event: AnyStatsigClientEvent) =>
      console.log(event);
    client.on('*', onAnyClientEvent);
    return () => client.off('*', onAnyClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
