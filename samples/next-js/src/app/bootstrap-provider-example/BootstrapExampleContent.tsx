'use client';

import React, { useContext } from 'react';

import { StatsigContext, useFeatureGate } from '@statsig/react-bindings';

export default function BootstrapExampleContent(): React.ReactElement {
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
