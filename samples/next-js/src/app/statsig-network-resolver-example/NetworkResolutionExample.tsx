'use client';

import React, { useContext } from 'react';

import {
  StatsigContext,
  StatsigProvider,
  useClientAsyncInit,
  useFeatureGate,
} from '@statsig/react-bindings';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

const blocked: string[] = [
  // 'featureassets.org', 'prodregistryv2.org'
];

/* eslint-disable no-console */

if (typeof window !== 'undefined') {
  const original = window.fetch;
  window.fetch = async (...args) => {
    const url = new URL(String(args[0]));

    console.log('[Request]', url.hostname, url.pathname, args[1]);

    const isBlocked = blocked.find((blocked) => url.hostname.includes(blocked));
    if (isBlocked) {
      return Promise.reject(new Error('failed to fetch'));
    }

    return original(...args);
  };
}

function Content() {
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
      <button
        onClick={() => {
          localStorage.clear();
        }}
      >
        Clear Local Storage
      </button>
    </div>
  );
}

export default function NetworkResolutionExample(): React.ReactElement {
  const { client, isLoading } = useClientAsyncInit(
    DEMO_CLIENT_KEY,
    {
      userID: 'a-user',
    },
    {
      networkConfig: {
        initializeFallbackUrls: ['https://api.statsig.com/v1/initialize'],
        logEventFallbackUrls: ['https://api.statsig.com/v1/log_event'],
      },
    },
  );

  if (isLoading) {
    return <div>Statsig Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
