import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import * as React from 'react';
import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import { _getStatsigGlobal } from '@statsig/client-core';

import { useStatsigInternalClientFactoryBootstrap } from '../useStatsigInternalClientFactoryBootstrap';

function clientFactory() {
  const client = MockRemoteServerEvalClient.create();

  // Add dataAdapter mock with both setData and setDataLegacy methods
  client.dataAdapter = {
    setData: jest.fn(),
    setDataLegacy: jest.fn(),
  };

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

const TestComponent = ({
  sdkKey,
  useLegacyClient,
  onClientCreated,
}: {
  sdkKey: string;
  useLegacyClient?: boolean;
  onClientCreated?: (client: any) => void;
}) => {
  const client = useStatsigInternalClientFactoryBootstrap(
    (_args) => {
      const { client } = clientFactory();
      onClientCreated?.(client);
      return client;
    },
    {
      sdkKey,
      initialUser: { userID: 'test-user' },
      initialValues: JSON.stringify({ test: 'data' }),
      statsigOptions: null,
      useLegacyClient,
    },
  );

  return <div data-testid="client-ready">{client ? 'Ready' : 'Not Ready'}</div>;
};

describe('useStatsigInternalClientFactoryBootstrap', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls setData when useLegacyClient is false', () => {
    let capturedClient: any = null;

    render(
      <TestComponent
        sdkKey="test-sdk-key-standard"
        useLegacyClient={false}
        onClientCreated={(client) => {
          capturedClient = client;
        }}
      />,
    );

    expect(capturedClient).not.toBeNull();
    expect(capturedClient.dataAdapter.setData).toHaveBeenCalledWith(
      JSON.stringify({ test: 'data' }),
    );
    expect(capturedClient.dataAdapter.setDataLegacy).not.toHaveBeenCalled();
    expect(capturedClient.initializeSync).toHaveBeenCalled();
  });

  it('calls setData when useLegacyClient is not provided (default behavior)', () => {
    let capturedClient: any = null;

    render(
      <TestComponent
        sdkKey="test-sdk-key-default"
        onClientCreated={(client) => {
          capturedClient = client;
        }}
      />,
    );

    expect(capturedClient).not.toBeNull();
    expect(capturedClient.dataAdapter.setData).toHaveBeenCalledWith(
      JSON.stringify({ test: 'data' }),
    );
    expect(capturedClient.dataAdapter.setDataLegacy).not.toHaveBeenCalled();
    expect(capturedClient.initializeSync).toHaveBeenCalled();
  });

  it('calls setDataLegacy when useLegacyClient is true', () => {
    let capturedClient: any = null;

    render(
      <TestComponent
        sdkKey="test-sdk-key-legacy"
        useLegacyClient={true}
        onClientCreated={(client) => {
          capturedClient = client;
        }}
      />,
    );

    expect(capturedClient).not.toBeNull();
    expect(capturedClient.dataAdapter.setDataLegacy).toHaveBeenCalledWith(
      JSON.stringify({ test: 'data' }),
      { userID: 'test-user' },
    );
    expect(capturedClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(capturedClient.initializeSync).toHaveBeenCalled();
  });
});
