import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useFeatureGate } from '@statsig/react-bindings';

function RenderReason() {
  const gate = useFeatureGate('a_gate');
  return <div>{gate.details.reason}</div>;
}

describe('Statsig Ready Ripcord', () => {
  let client: StatsigClient;

  beforeAll(() => {
    client = new StatsigClient('client-key', {});

    render(
      <StatsigProvider client={client}>
        <RenderReason />
      </StatsigProvider>,
    );
  });

  it('renders children', async () => {
    await act(async () => {
      (client as any).dataAdapter.getDataAsync = 1;
      await client.initializeAsync();
    });

    await waitFor(() => screen.getByText('NoValues'));
  });
});
