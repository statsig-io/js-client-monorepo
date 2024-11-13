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

const MemoizedFeatureGateComponent = ({
  forceRender,
}: {
  forceRender: number;
}) => {
  const options = { disableExposureLog: true };
  const { value } = useFeatureGate('a_gate', options);
  return (
    <div data-testid="memoized-feature-gate">
      {String(value)}_{forceRender}
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
      <StatsigProvider client={client as any}>
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

  it('properly memoizes when options object reference changes, but rerenders when options values change', async () => {
    jest.clearAllMocks();

    const { rerender } = render(
      <StatsigProvider client={client as any}>
        <MemoizedFeatureGateComponent forceRender={1} />
      </StatsigProvider>,
    );

    await waitFor(() => {
      screen.getByTestId('memoized-feature-gate');
    });

    expect(client.getFeatureGate).toHaveBeenCalledTimes(1);

    rerender(
      <StatsigProvider client={client as any}>
        <MemoizedFeatureGateComponent forceRender={2} />
      </StatsigProvider>,
    );

    await waitFor(() => {
      screen.getByTestId('memoized-feature-gate');
    });

    expect(client.getFeatureGate).toHaveBeenCalledTimes(1);

    // Modify the component to use different options
    const ModifiedComponent = ({ forceRender }: { forceRender: number }) => {
      const options = { disableExposureLog: false }; // Changed from true to false
      const { value } = useFeatureGate('a_gate', options);
      return (
        <div data-testid="memoized-feature-gate">
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

    // Should call getFeatureGate again because options actually changed
    expect(client.getFeatureGate).toHaveBeenCalledTimes(2);
  });
});
