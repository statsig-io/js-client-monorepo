import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import StatsigProvider from '../StatsigProvider';

describe('StatsigProvider', () => {
  let onStatusChange: (data: Record<string, unknown>) => void;

  it('renders children', async () => {
    const client = MockRemoteServerEvalClient.create();
    client.initialize.mockReturnValue(Promise.resolve());
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

    act(() => onStatusChange({ loadingStatus: 'Network' }));
    await waitFor(() => screen.getByTestId('first-child'));
  });
});
