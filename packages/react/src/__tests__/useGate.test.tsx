/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import StatsigProvider from '../StatsigProvider';
import { createDeferredPromise, newMockRemoteClient } from './MockClients';

describe('useGate', () => {
  beforeAll(() => {
    const { promise } = createDeferredPromise<void>();

    const client = newMockRemoteClient();
    client.initialize.mockResolvedValueOnce(promise);

    render(
      <StatsigProvider client={client}>
        <div data-testid="first-child" />
      </StatsigProvider>,
    );
  });

  it('foo', async () => {
    await waitFor(() => screen.getByTestId('first-child'));
  });
});
