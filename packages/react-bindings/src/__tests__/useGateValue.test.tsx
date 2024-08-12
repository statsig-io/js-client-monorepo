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

describe('useGateValue', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockReturnValue(Promise.resolve());
    client.checkGate.mockReturnValue(true);
    (client.loadingStatus as any) = 'Ready';

    render(
      <StatsigProvider client={client}>
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
});
