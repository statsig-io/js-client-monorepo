/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import StatsigProvider from '../StatsigProvider';
import { createDeferredPromise, newMockRemoteClient } from './MockClients';

describe('StatsigProvider', () => {
  it('renders children', async () => {
    const deferred = createDeferredPromise<void>();
    const client = newMockRemoteClient();
    client.initialize.mockReturnValueOnce(deferred.promise);

    render(
      <StatsigProvider client={client}>
        <div data-testid="first-child" />
      </StatsigProvider>,
    );

    deferred.resolve();
    await waitFor(() => screen.getByTestId('first-child'));
  });
});
