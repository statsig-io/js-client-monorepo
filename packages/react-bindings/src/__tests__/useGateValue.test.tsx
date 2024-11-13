import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import useGateValue from '../useGateValue';
import { useStatsigClient } from '../useStatsigClient';

const UseGateValueComponent = () => {
  const value = useGateValue('a_gate');
  return <div data-testid="use-gate-value">{String(value)}</div>;
};

const CheckGateComponent = () => {
  const { checkGate } = useStatsigClient();
  return (
    <div data-testid="check-gate-value">{String(checkGate('a_gate'))}</div>
  );
};

const MemoizedGateComponent = ({ forceRender }: { forceRender: number }) => {
  const value = useGateValue('a_gate', { disableExposureLog: true });
  return (
    <div data-testid="memoized-gate">
      {String(value)}_{forceRender}
    </div>
  );
};

describe('useGateValue', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockReturnValue(Promise.resolve());
    client.checkGate.mockReturnValue(true);
    (client.loadingStatus as any) = 'Ready';

    render(
      <StatsigProvider client={client as any}>
        <UseGateValueComponent />
        <CheckGateComponent />
      </StatsigProvider>,
    );
  });

  it('gets the correct value for checkGate', async () => {
    await waitFor(() => {
      const gateValue = screen.queryByTestId('check-gate-value');
      expect(gateValue).toHaveTextContent('true');
    });
  });

  it('gets the correct value for useGateValue', async () => {
    await waitFor(() => {
      const gateValue = screen.queryByTestId('use-gate-value');
      expect(gateValue).toHaveTextContent('true');
    });
  });

  it('properly memoizes when options object reference changes, but rerenders when options values change', async () => {
    jest.clearAllMocks();

    const { rerender } = render(
      <StatsigProvider client={client as any}>
        <MemoizedGateComponent forceRender={1} />
      </StatsigProvider>,
    );

    await waitFor(() => {
      screen.getByTestId('memoized-gate');
    });

    expect(client.checkGate).toHaveBeenCalledTimes(1);

    rerender(
      <StatsigProvider client={client as any}>
        <MemoizedGateComponent forceRender={2} />
      </StatsigProvider>,
    );

    await waitFor(() => {
      screen.getByTestId('memoized-gate');
    });

    expect(client.checkGate).toHaveBeenCalledTimes(1);

    // Modify the component to use different options
    const ModifiedComponent = ({ forceRender }: { forceRender: number }) => {
      const value = useGateValue('a_gate', { disableExposureLog: false }); // Changed from true to false
      return (
        <div data-testid="memoized-gate">
          {String(value)}_{forceRender}
        </div>
      );
    };

    // Rerender with the modified component
    rerender(
      <StatsigProvider client={client as any}>
        <ModifiedComponent forceRender={2} />
      </StatsigProvider>,
    );

    // Should call checkGate again because options actually changed
    expect(client.checkGate).toHaveBeenCalledTimes(2);
  });
});
