import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  Log,
  PrecomputedEvaluationsInterface,
  SDKType,
  StatsigClientEventCallback,
} from '@statsig/client-core';

import { StatsigProvider } from '../StatsigProvider';
import { useStatsigClient } from '../useStatsigClient';

describe('StatsigProvider', () => {
  let onStatusChange: StatsigClientEventCallback<any>;
  let client: jest.Mocked<PrecomputedEvaluationsInterface>;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockReturnValue(Promise.resolve());

    client.$on.mockImplementation((event, callback) => {
      if (event === 'values_updated') {
        onStatusChange = callback;
      }
    });

    render(
      <StatsigProvider client={client as any}>
        <div data-testid="first-child" />
      </StatsigProvider>,
    );
  });

  it('renders children', async () => {
    act(() => {
      (client.loadingStatus as any) = 'Ready';
      onStatusChange({ name: 'values_updated', status: 'Ready', values: null });
    });
    await waitFor(() => screen.getByTestId('first-child'));
  });

  it('sets the react binding type', () => {
    expect(SDKType._get('')).toBe('js-mono-react');
  });

  it('logs a warning when both client and configuration props are provided', () => {
    const warnSpy = jest.spyOn(Log, 'warn').mockImplementation();

    render(
      <StatsigProvider
        client={client as any}
        sdkKey="test-key"
        user={{ userID: 'test-user' }}
      >
        <div data-testid="test-child" />
      </StatsigProvider>,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      'Both client and configuration props (sdkKey, user) were provided to StatsigProvider. The client prop will be used and the configuration props will be ignored.',
    );

    warnSpy.mockRestore();
  });

  it('handles switching between client and configuration props', async () => {
    let latestClient: PrecomputedEvaluationsInterface | undefined;

    // Create a test component that uses the useStatsigClient hook
    const ClientComponent = ({ testId }: { testId: string }) => {
      const { client } = useStatsigClient();

      latestClient = client;

      return <div data-testid={testId} />;
    };

    // Render with the first client
    const { rerender } = render(
      <StatsigProvider client={client as any}>
        <ClientComponent testId="client-test" />
      </StatsigProvider>,
    );

    const firstClient = latestClient;

    // Switch to configuration props
    rerender(
      <StatsigProvider sdkKey="test-key" user={{ userID: 'test-user' }}>
        <ClientComponent testId="client-test" />
      </StatsigProvider>,
    );

    const secondClient = latestClient;

    expect(secondClient).not.toEqual(firstClient);

    // Switch back to client props with a different client
    rerender(
      <StatsigProvider client={client as any}>
        <ClientComponent testId="client-test" />
      </StatsigProvider>,
    );

    const thirdClient = latestClient;

    expect(thirdClient).toEqual(firstClient);
    expect(thirdClient).not.toEqual(secondClient);
  });
});
