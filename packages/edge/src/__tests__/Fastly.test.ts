import { DcsResponse } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

global.fetch = jest.fn();

describe('StatsigEdgeClient - initializeFromFastly', () => {
  let client: StatsigEdgeClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigEdgeClient('test-sdk-key');
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    mockDataAdapterSetData = jest.spyOn(client.dataAdapter, 'setData');
    mockInitializeSync = jest.spyOn(client, 'initializeSync').mockReturnValue({
      success: true,
      duration: 0,
      source: 'Bootstrap' as any,
      error: null,
      sourceUrl: null,
    });
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

    expect(mockDataAdapterSetData).toHaveBeenCalledWith(
      JSON.stringify(mockData),
    );
    expect(mockInitializeSync).toHaveBeenCalledTimes(1);
    expect(mockInitializeSync).toHaveBeenCalledWith({
      disableBackgroundCacheRefresh: true,
    });
    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
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

    expect(mockDataAdapterSetData).toHaveBeenCalledWith(
      JSON.stringify(DcsResponse),
    );
    expect(mockInitializeSync).toHaveBeenCalledTimes(1);
    expect(mockInitializeSync).toHaveBeenCalledWith({
      disableBackgroundCacheRefresh: true,
    });
    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
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
