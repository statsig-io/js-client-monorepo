/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import StatsigProvider from '../StatsigProvider';
import useGate from '../useGate';
import {
  DeferredPromise,
  createDeferredPromise,
  newMockRemoteClient,
} from './MockClients';

const GateComponent = () => {
  const { value } = useGate('a_gate');
  return <div data-testid="gate-value">{String(value)}</div>;
};

describe('useGate', () => {
  let deferred: DeferredPromise<void>;

  beforeEach(() => {
    deferred = createDeferredPromise<void>();

    const client = newMockRemoteClient();
    client.initialize.mockResolvedValue(deferred.promise);
    client.checkGate.mockReturnValue(true);

    render(
      <StatsigProvider client={client}>
        <GateComponent />
      </StatsigProvider>,
    );
  });

  it('does not render before the init promise resolves', () => {
    expect(screen.queryByTestId('gate-value')).toBeNull();
  });

  it('renders the gate value', async () => {
    deferred.resolve();

    await waitFor(() => {
      const loadingText = screen.queryByTestId('gate-value');
      expect(loadingText).toBeInTheDocument();
    });
  });
});
