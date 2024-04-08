import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
} from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import useGateValue from '../useGateValue';

const GateComponent = () => {
  const value = useGateValue('a_gate');
  return <div data-testid="gate-value">{String(value)}</div>;
};

describe('useGate', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;
  let onStatusChange: StatsigClientEventCallback<StatsigClientEventName>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create() as any;
    client.shutdown.mockReturnValue(Promise.resolve());
    client.checkGate.mockReturnValue(true);
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
      onStatusChange({ name: 'values_updated', status: 'Ready', values: null });
    });

    await waitFor(() => {
      const gateValue = screen.queryByTestId('gate-value');
      expect(gateValue).toBeInTheDocument();
      expect(gateValue).toHaveTextContent('true');
    });
  });
});
