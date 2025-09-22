import { DcsResponse } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

global.fetch = jest.fn();

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

describe('StatsigEdgeClient - initializeFromFastly', () => {
  let client: StatsigEdgeClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigEdgeClient('test-sdk-key');
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  it('should initialize successfully when data is available', async () => {
    const mockData = DcsResponse;
    const mockResponse = {
      json: jest.fn().mockResolvedValue(mockData),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'test-store',
      'test-key',
      'test-backend',
      'test-token',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
      {
        method: 'GET',
        headers: {
          'Fastly-Key': 'test-token',
          Accept: 'application/json',
        },
        backend: 'test-backend',
      },
    );
    expect(mockResponse.json).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).toHaveBeenCalledWith(
      JSON.stringify(mockData),
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

  it('should fallback to async initialization when no data is returned', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue(null),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'test-store',
      'test-key',
      'test-backend',
      'test-token',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
      {
        method: 'GET',
        headers: {
          'Fastly-Key': 'test-token',
          Accept: 'application/json',
        },
        backend: 'test-backend',
      },
    );

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      fromCache: false,
    });
  });

  it('should fallback to async initialization when data is empty', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue(''),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'test-store',
      'test-key',
      'test-backend',
      'test-token',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
      {
        method: 'GET',
        headers: {
          'Fastly-Key': 'test-token',
          Accept: 'application/json',
        },
        backend: 'test-backend',
      },
    );
    expect(mockResponse.json).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      fromCache: false,
    });
  });

  it('should fallback to async initialization when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await client.initializeFromFastly(
      'test-store',
      'test-key',
      'test-backend',
      'test-token',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
      {
        method: 'GET',
        headers: {
          'Fastly-Key': 'test-token',
          Accept: 'application/json',
        },
        backend: 'test-backend',
      },
    );

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
