'use client';

import * as React from 'react';
import { useContext } from 'react';

import { OnDeviceEvalAdapter } from '@statsig/js-on-device-eval-adapter';
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

export default function OnDeviceEvalAdapterExample({
  specs,
}: {
  specs: string | null;
}): React.ReactElement {
  const adapter = React.useMemo(() => {
    const adapter = new OnDeviceEvalAdapter(null);
    if (specs) {
      adapter.setData(specs);
    }
    return adapter;
  }, [specs]);

  const { client } = useClientAsyncInit(
    DEMO_CLIENT_KEY,
    {
      userID: 'a-user',
    },
    {
      networkConfig: {
        preventAllNetworkTraffic: true,
      },
      overrideAdapter: adapter,
    },
  );

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
