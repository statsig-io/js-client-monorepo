import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { StatsigProviderOnDeviceEval } from '../StatsigProviderOnDeviceEval';
import useFeatureGate from '../useFeatureGate';
import { useStatsigOnDeviceEvalClient } from '../useStatsigOnDeviceEvalClient';

const UseFeatureGateComponent = () => {
  const { value } = useFeatureGate('a_gate', { userID: 'a_user' });
  return <div data-testid="use-feature-gate">{String(value)}</div>;
};

const GetFeatureGateComponent = () => {
  const { getFeatureGate } = useStatsigOnDeviceEvalClient();
  return (
    <div data-testid="get-feature-gate">
      {String(getFeatureGate('a_gate', { userID: 'a_user' }).value)}
    </div>
  );
};

describe('useFeatureGate', () => {
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockReturnValue(Promise.resolve());
    client.getFeatureGate.mockReturnValue({ value: true } as any);
    (client.loadingStatus as any) = 'Ready';

    render(
      <StatsigProviderOnDeviceEval client={client as any}>
        <UseFeatureGateComponent />
        <GetFeatureGateComponent />
      </StatsigProviderOnDeviceEval>,
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
