'use client';

import React, { useContext, useEffect } from 'react';

import { LogLevel } from '@statsig/client-core';
import {
  StatsigContext,
  StatsigProvider,
  StatsigUser,
  useClientBootstrapInit,
  useFeatureGate,
  useParameterStore,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

/* eslint-disable no-console */

function Content() {
  const { value, details } = useFeatureGate('a_gate');
  const parameterStore = useParameterStore('a_param_store');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
      <div>
        a_param: {parameterStore.get('a_bool_param') ? 'true' : 'false'}
      </div>
    </div>
  );
}

export default function BootstrapExample({
  user,
  values,
}: {
  user: StatsigUser;
  values: string;
}): React.ReactElement {
  const client = useClientBootstrapInit(DEMO_CLIENT_KEY, user, values, {
    logLevel: LogLevel.Debug,
  });

  useEffect(() => {
    const onAnyClientEvent = (): void => client.on('*', onAnyClientEvent);
    return () => client.off('*', onAnyClientEvent);
  }, [client]);

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
