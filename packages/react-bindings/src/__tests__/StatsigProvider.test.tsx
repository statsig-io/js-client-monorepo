import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
} from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';

describe('StatsigProvider', () => {
  let onStatusChange: StatsigClientEventCallback<any>;

  it('renders children', async () => {
    const client: jest.Mocked<PrecomputedEvaluationsInterface> =
      MockRemoteServerEvalClient.create();
    client.shutdown.mockReturnValue(Promise.resolve());

    client.__on.mockImplementation((event, callback) => {
      if (event === 'values_updated') {
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
      onStatusChange({ name: 'values_updated', status: 'Ready', values: null });
    });
    await waitFor(() => screen.getByTestId('first-child'));
  });
});
