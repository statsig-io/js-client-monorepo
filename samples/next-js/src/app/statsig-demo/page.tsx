'use client';

import * as React from 'react';

import { useFeatureGate } from '@statsig/react-bindings';

export default function Home(): React.ReactElement {
  const gate = useFeatureGate('a_gate'); // Some gate created on console.statsig.com

  return (
    <>
      <h1>My Gate</h1>
      <p>Value: {gate.value ? 'Pass' : 'Fail'}</p>
      <p>Reason: {gate.details.reason}</p>
    </>
  );
}
