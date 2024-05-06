import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import useFeatureGate from '../useFeatureGate';
import { useStatsigClient } from '../useStatsigClient';

const UseFeatureGateComponent = () => {
  const { value } = useFeatureGate('a_gate');
  return <div data-testid="use-feature-gate">{String(value)}</div>;
};

const GetFeatureGateComponent = () => {
  const { getFeatureGate } = useStatsigClient();
  return (
    <div data-testid="get-feature-gate">
      {String(getFeatureGate('a_gate').value)}
    </div>
  );
};

describe('useFeatureGate', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.shutdown.mockReturnValue(Promise.resolve());
    client.getFeatureGate.mockReturnValue({ value: true } as any);
    (client.loadingStatus as any) = 'Ready';

    render(
      <StatsigProvider client={client}>
        <UseFeatureGateComponent />
        <GetFeatureGateComponent />
      </StatsigProvider>,
    );
  });

  it('gets the correct value for getFeatureGate', async () => {
    await waitFor(() => {
      const gateValue = screen.queryByTestId('get-feature-gate');
      expect(gateValue).toHaveTextContent('true');
    });
  });

  it('gets the correct value for useFeatureGate', async () => {
    await waitFor(() => {
      const gateValue = screen.queryByTestId('use-feature-gate');
      expect(gateValue).toHaveTextContent('true');
    });
  });
});
