import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { StatsigClientEventCallback } from '@statsig/client-core';

import StatsigProvider from '../StatsigProvider';

describe('StatsigProvider', () => {
  let onStatusChange: StatsigClientEventCallback;

  it('renders children', async () => {
    const client = MockRemoteServerEvalClient.create();
    client.shutdown.mockReturnValue(Promise.resolve());

    client.on.mockImplementation((event, callback) => {
      if (event === 'status_change') {
        onStatusChange = callback;
      }
    });

    render(
      <StatsigProvider client={client}>
        <div data-testid="first-child" />
      </StatsigProvider>,
    );

    act(() => {
      (client.loadingStatus as any) = 'Ready';
      onStatusChange({ event: 'status_change', loadingStatus: 'Ready' });
    });
    await waitFor(() => screen.getByTestId('first-child'));
  });
});
