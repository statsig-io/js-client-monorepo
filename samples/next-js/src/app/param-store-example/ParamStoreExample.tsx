'use client';

import * as React from 'react';
import { useEffect } from 'react';

import { AnyStatsigClientEvent } from '@statsig/client-core';
import { LocalOverrideAdapter } from '@statsig/js-local-overrides';
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
  const overriddenStore = useParameterStore('overridden_param_store');

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

      <div
        style={{ marginTop: 32, borderTop: '1px solid #ccc', paddingTop: 16 }}
      >
        <strong>Overridden Param Store:</strong>
        <ResultRow
          title="override_string"
          result={overriddenStore.get('override_string', 'default')}
        />
        <ResultRow
          title="override_number"
          result={String(overriddenStore.get('override_number', 0))}
        />
        <ResultRow
          title="override_bool"
          result={overriddenStore.get('override_bool', false) ? 'Yes' : 'No'}
        />
      </div>
    </div>
  );
}

export default function ParamStoreExample(): React.ReactElement {
  const [overrideAdapter] = React.useState(() => {
    const adapter = new LocalOverrideAdapter();
    adapter.overrideParamStore('overridden_param_store', {
      override_string: 'Local Override Value!',
      override_number: 999,
      override_bool: true,
    });
    return adapter;
  });

  const { client, isLoading } = useClientAsyncInit(
    DEMO_CLIENT_KEY,
    { userID: 'a-user' },
    { overrideAdapter },
  );

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
