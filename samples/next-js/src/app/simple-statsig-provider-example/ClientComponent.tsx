'use client';

import { useContext } from 'react';

import {
  StatsigContext,
  StatsigProvider,
  useFeatureGate,
} from '@statsig/react-bindings';

import {
  DEMO_CLIENT_KEY,
  DEMO_CLIENT_KEY_WITH_DCS_ENABLED,
} from '../../utils/constants';

/* eslint-disable no-console */

function Content() {
  const { value, details } = useFeatureGate('a_gate');
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ height: 100, width: 300, padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        a_gate: {value ? 'Passing' : 'Failing'} ({details.reason})
      </div>
    </div>
  );
}

export default function ClientComponent(): JSX.Element {
  return (
    <div>
      <StatsigProvider
        sdkKey={DEMO_CLIENT_KEY}
        user={{ userID: 'a-user' }}
        loadingComponent={
          <div style={{ height: 100, width: 300, padding: 16 }}>Loading...</div>
        }
        options={{ disableStatsigEncoding: true }}
      >
        <Content />
      </StatsigProvider>
      <StatsigProvider
        sdkKey={DEMO_CLIENT_KEY_WITH_DCS_ENABLED}
        user={{ userID: 'a-user' }}
      >
        <Content />
      </StatsigProvider>
    </div>
  );
}
