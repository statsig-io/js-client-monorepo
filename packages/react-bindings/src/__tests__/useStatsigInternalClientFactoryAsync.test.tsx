import '@testing-library/jest-dom';
import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { _getStatsigGlobal } from '@statsig/client-core';

import { useStatsigInternalClientFactoryAsync } from '../useStatsigInternalClientFactoryAsync';

function clientFactory() {
  const client = MockRemoteServerEvalClient.create();
  let resolveinitializeAsync: (() => void) | undefined;
  client.initializeAsync.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveinitializeAsync = resolve;
    }),
  );
  return {
    client,
    finishInitializeAsync: () => {
      resolveinitializeAsync?.();
    },
  };
}

const StatsigClientLoadingStatus = ({
  sdkKey,
  onInitializeAsyncStart,
}: {
  sdkKey: string;
  onInitializeAsyncStart?: (finish: () => void) => void;
}) => {
  const { isLoading } = useStatsigInternalClientFactoryAsync(
    () => {
      const { client, finishInitializeAsync } = clientFactory();
      onInitializeAsyncStart?.(finishInitializeAsync);
      return client;
    },
    { sdkKey, initialUser: {}, statsigOptions: {} },
  );
  return (
    <div data-testid="loading-status">{isLoading ? 'Loading' : 'Ready'}</div>
  );
};

describe('useStatsigInternalClientFactoryAsync isLoading', () => {
  const readySdkKey = 'client-key-ready';

  beforeAll(() => {
    // Create mock SDK that's ready
    const { client } = clientFactory();
    (client.loadingStatus as any) = 'Ready';

    // Add this client to Statsig Global with the sdkKey
    const global = _getStatsigGlobal();
    const instances = global.instances ?? {};
    instances[readySdkKey] = client;
    global.instances = instances;
  });

  afterAll(() => {
    delete _getStatsigGlobal().instances;
  });

  it('starts as Loading and changes to Ready once initialize completes', async () => {
    let finishInitializeAsync: (() => void) | undefined;
    const result = render(
      <StatsigClientLoadingStatus
        sdkKey="client-key-new"
        onInitializeAsyncStart={(finish) => {
          finishInitializeAsync = finish;
        }}
      />,
    );

    const loadingStatusElement = result.queryByTestId('loading-status');
    expect(loadingStatusElement).toHaveTextContent('Loading');

    act(() => {
      finishInitializeAsync?.();
    });

    await waitFor(() => {
      expect(loadingStatusElement).toHaveTextContent('Ready');
    });
  });

  it('is false on first render if the client is ready', () => {
    const result = render(<StatsigClientLoadingStatus sdkKey={readySdkKey} />);

    const loadingStatusElement = result.queryByTestId('loading-status');
    expect(loadingStatusElement).toHaveTextContent('Ready');
  });
});
