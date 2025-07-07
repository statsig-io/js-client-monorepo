import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import * as React from 'react';

import { StatsigUser } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { useClientBootstrapInit } from '../useClientBootstrapInit';

const mockUser: StatsigUser = { userID: 'test-user' };
const mockValues =
  '{"feature_gates":{},"dynamic_configs":{},"layer_configs":{}}';
const mockSdkKey = 'client-test-key';

jest.mock('@statsig/js-client');

const TestComponent = ({
  useLegacyFormat = false,
}: {
  useLegacyFormat?: boolean;
}) => {
  const client = useClientBootstrapInit(
    mockSdkKey,
    mockUser,
    mockValues,
    null,
    useLegacyFormat,
  );

  return (
    <div data-testid="client-status">
      {client ? 'Client Ready' : 'No Client'}
    </div>
  );
};

describe('useClientBootstrapInit', () => {
  let mockClient: any;
  let mockSetData: jest.Mock;
  let mockSetDataLegacy: jest.Mock;
  let MockedStatsigClient: jest.MockedClass<typeof StatsigClient>;

  beforeEach(() => {
    mockSetData = jest.fn();
    mockSetDataLegacy = jest.fn();

    mockClient = {
      dataAdapter: {
        setData: mockSetData,
        setDataLegacy: mockSetDataLegacy,
      },
      initializeSync: jest.fn(),
    };

    MockedStatsigClient = StatsigClient as jest.MockedClass<
      typeof StatsigClient
    >;
    MockedStatsigClient.mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls setData when useLegacyFormat is false (default)', () => {
    render(<TestComponent />);

    expect(mockSetData).toHaveBeenCalledWith(mockValues);
    expect(mockSetDataLegacy).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).toHaveBeenCalled();
  });

  it('calls setData when useLegacyFormat is explicitly false', () => {
    render(<TestComponent useLegacyFormat={false} />);

    expect(mockSetData).toHaveBeenCalledWith(mockValues);
    expect(mockSetDataLegacy).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).toHaveBeenCalled();
  });

  it('calls setDataLegacy when useLegacyFormat is true', () => {
    render(<TestComponent useLegacyFormat={true} />);

    expect(mockSetDataLegacy).toHaveBeenCalledWith(mockValues, mockUser);
    expect(mockSetData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).toHaveBeenCalled();
  });

  it('returns a client instance', () => {
    const result = render(<TestComponent />);

    const statusElement = result.queryByTestId('client-status');
    expect(statusElement).toHaveTextContent('Client Ready');
  });

  it('passes correct parameters to useStatsigInternalClientFactoryBootstrap', () => {
    render(<TestComponent useLegacyFormat={true} />);

    expect(mockClient.initializeSync).toHaveBeenCalled();
    expect(mockSetDataLegacy).toHaveBeenCalledWith(mockValues, mockUser);
  });
});
