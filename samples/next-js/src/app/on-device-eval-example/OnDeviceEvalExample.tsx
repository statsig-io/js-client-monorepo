'use client';

import React, { useContext } from 'react';

import {
  LogLevel,
  StatsigContext,
  StatsigProviderOnDeviceEval,
  useFeatureGate,
} from '@statsig/react-bindings-on-device-eval';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

function Content() {
  const aUserGate = useFeatureGate('partial_gate', { userID: 'a-user' });
  const bUserGate = useFeatureGate('partial_gate', { userID: 'b-user' });
  const { renderVersion } = useContext(StatsigContext);

  return (
    <div style={{ padding: 16 }}>
      <div>Render Version: {renderVersion}</div>
      <div>
        partial_gate (a-user): {aUserGate.value ? 'Passing' : 'Failing'} (
        {aUserGate.details.reason})
      </div>
      <div>
        partial_gate (b-user): {bUserGate.value ? 'Passing' : 'Failing'} (
        {bUserGate.details.reason})
      </div>
    </div>
  );
}

export default function OnDeviceEvalExample(): React.ReactElement {
  return (
    <StatsigProviderOnDeviceEval
      sdkKey={DEMO_CLIENT_KEY}
      options={{
        environment: { tier: 'development' },
        logLevel: LogLevel.Debug,
      }}
      loadingComponent={<div>Loading...</div>}
    >
      <Content />
    </StatsigProviderOnDeviceEval>
  );
}
