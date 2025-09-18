import { DcsResponse } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

jest.mock('@vercel/edge-config', () => ({
  getAll: jest.fn(),
}));

jest.mock('@statsig/js-on-device-eval-client', () => {
  const mockClient = {
    dataAdapter: {
      setData: jest.fn(),
    },
    initializeSync: jest.fn().mockReturnValue({
      success: true,
      fromCache: true,
    }),
    initializeAsync: jest.fn().mockResolvedValue({
      success: true,
      fromCache: false,
    }),
    checkGate: jest.fn(),
  };

  return {
    StatsigOnDeviceEvalClient: jest.fn().mockImplementation(() => mockClient),
  };
});

describe('StatsigEdgeClient - initializeFromVercel', () => {
  let client: StatsigEdgeClient;
  let mockGetAll: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigEdgeClient('test-sdk-key');
    const { getAll } = jest.requireMock('@vercel/edge-config');
    mockGetAll = getAll;
  });

  it('should initialize successfully when specs are available', async () => {
    const mockSpecs = DcsResponse;
    const mockConfigData = { 'test-config-key': mockSpecs };

    mockGetAll.mockResolvedValue(mockConfigData);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).toHaveBeenCalledWith(
      JSON.stringify(mockSpecs),
    );
    expect(mockClient.initializeSync).toHaveBeenCalledTimes(1);
    expect(mockClient.initializeSync).toHaveBeenCalledWith({
      disableBackgroundCacheRefresh: true,
    });
    expect(mockClient.initializeAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      fromCache: true,
    });
  });

  it('should fallback to async initialization when no specs are available', async () => {
    mockGetAll.mockResolvedValue(null);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      fromCache: false,
    });
  });

  it('should fallback to async initialization when config key is not found', async () => {
    const mockConfigData = { 'other-config-key': DcsResponse };
    mockGetAll.mockResolvedValue(mockConfigData);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      fromCache: false,
    });
  });

  it('should handle undefined config data', async () => {
    mockGetAll.mockResolvedValue(undefined);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      fromCache: false,
    });
  });
});
