import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
} from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import useGate from '../useGate';

const GateComponent = () => {
  const { value } = useGate('a_gate');
  return <div data-testid="gate-value">{String(value)}</div>;
};

describe('useGate', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;
  let onStatusChange: StatsigClientEventCallback;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.shutdown.mockReturnValue(Promise.resolve());
    client.getFeatureGate.mockReturnValue({ value: true } as any);
    client.on.mockImplementation((event, callback) => {
      if (event === 'values_updated') {
        onStatusChange = callback;
      }
    });

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
    act(() => {
      (client.loadingStatus as any) = 'Ready';
      onStatusChange({ event: 'values_updated', status: 'Ready' });
    });

    await waitFor(() => {
      const loadingText = screen.queryByTestId('gate-value');
      expect(loadingText).toBeInTheDocument();
    });
  });
});
