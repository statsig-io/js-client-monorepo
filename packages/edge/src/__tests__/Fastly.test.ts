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

  it('should initialize successfully with KV store when data is available', async () => {
    const mockData = DcsResponse;
    const mockResponse = {
      json: jest.fn().mockResolvedValue(mockData),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
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
        backend: 'fastly_api',
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

  it('should initialize successfully with config store when data is available', async () => {
    const mockData = { item_value: JSON.stringify(DcsResponse) };
    const mockResponse = {
      json: jest.fn().mockResolvedValue(mockData),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'config',
      'test-store',
      'test-key',
      'test-token',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.fastly.com/resources/stores/config/test-store/item/test-key',
      {
        method: 'GET',
        headers: {
          'Fastly-Key': 'test-token',
          Accept: 'application/json',
        },
        backend: 'fastly_api',
      },
    );
    expect(mockResponse.json).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).toHaveBeenCalledWith(
      JSON.stringify(DcsResponse),
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

  it('should return error when no data is returned from KV store', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue(null),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
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
        backend: 'fastly_api',
      },
    );

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Config specs were not parsed successfully'),
      sourceUrl:
        'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
    });
  });

  it('should return error when data is empty from KV store', async () => {
    const mockResponse = {
      json: jest.fn().mockResolvedValue(''),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
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
        backend: 'fastly_api',
      },
    );
    expect(mockResponse.json).toHaveBeenCalledTimes(1);

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Config specs were not parsed successfully'),
      sourceUrl:
        'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
    });
  });

  it('should return error when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
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
        backend: 'fastly_api',
      },
    );

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
    expect(mockClient.initializeAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Failed to retrieve config specs from Fastly'),
      sourceUrl:
        'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
    });
  });

  it('should return error for invalid store type', async () => {
    const result = await client.initializeFromFastly(
      'invalid' as any,
      'test-store',
      'test-key',
      'test-token',
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Invalid Fastly store type'),
      sourceUrl: 'Invalid Fastly store type',
    });
  });
});
