/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient, TestPromise } from 'statsig-test-helpers';

import StatsigProvider from '../StatsigProvider';

describe('StatsigProvider', () => {
  it('renders children', async () => {
    const promise = TestPromise.create<void>();
    const client = MockRemoteServerEvalClient.create();
    client.initialize.mockReturnValueOnce(promise);

    render(
      <StatsigProvider client={client}>
        <div data-testid="first-child" />
      </StatsigProvider>,
    );

    promise.resolve();
    await waitFor(() => screen.getByTestId('first-child'));
  });
});
