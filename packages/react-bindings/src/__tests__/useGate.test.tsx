/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient, TestPromise } from 'statsig-test-helpers';

import StatsigProvider from '../StatsigProvider';
import useGate from '../useGate';

const GateComponent = () => {
  const { value } = useGate('a_gate');
  return <div data-testid="gate-value">{String(value)}</div>;
};

describe('useGate', () => {
  let promise: TestPromise<void>;

  beforeEach(() => {
    promise = TestPromise.create<void>();

    const client = MockRemoteServerEvalClient.create();
    client.initialize.mockReturnValue(promise);
    client.getFeatureGate.mockReturnValue({ value: true } as any);

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
    promise.resolve();

    await waitFor(() => {
      const loadingText = screen.queryByTestId('gate-value');
      expect(loadingText).toBeInTheDocument();
    });
  });
});
