import { DcsResponse, toStartWith } from 'statsig-test-helpers';

import { StatsigFastlyClient } from '../provider/fastly';

global.fetch = jest.fn();
expect.extend({ toStartWith });
describe('StatsigFastlyClient', () => {
  let client: StatsigFastlyClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigFastlyClient('test-sdk-key');
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
      text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
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
    expect(mockResponse.text).toHaveBeenCalledTimes(1);

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
      text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
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
    expect(mockResponse.text).toHaveBeenCalledTimes(1);

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
      text: jest.fn().mockResolvedValue(null),
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
      error: {
        message: 'Config specs were not parsed successfully',
      } as Error,
      sourceUrl:
        'https://api.fastly.com/resources/stores/kv/test-store/keys/test-key',
    });
  });

  it('should return error when data is empty from KV store', async () => {
    const mockResponse = {
      text: jest.fn().mockResolvedValue(''),
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
    expect(mockResponse.text).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: {
        message: 'Config specs were not parsed successfully',
      } as Error,
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
      error: {
        message: 'Failed to retrieve config specs from Fastly',
      } as Error,
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
      error: { message: 'Invalid Fastly store type' } as Error,
      sourceUrl: 'Invalid Fastly store type',
    });
  });

  it('should set correct backend property for event logging', async () => {
    const mockData = DcsResponse;
    const mockResponse = {
      text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
      'test-token',
    );

    jest.clearAllMocks();
    mockFetch.mockResolvedValue(new Response() as any);

    client.logEvent('test_event', { userID: 'test-user' });
    await client.flush();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/rgstr'),
      expect.objectContaining({
        backend: 'statsig_flush',
      }),
    );
  });

  it('should use correct URL for flush requests', async () => {
    const mockData = DcsResponse;
    const mockResponse = {
      text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
      'test-token',
    );

    jest.clearAllMocks();
    mockFetch.mockResolvedValue(new Response() as any);

    client.logEvent('test_event', { userID: 'test-user' });
    await client.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const url = callArgs[0] as string;

    expect(url).toStartWith('https://prodregistryv2.org/v1/rgstr');
  });

  it('should use correct URL and backend property for initializeAsync requests', async () => {
    const mockData = DcsResponse;
    const mockResponse = {
      text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      ok: true,
      status: 200,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    await client.initializeFromFastly(
      'kv',
      'test-store',
      'test-key',
      'test-token',
    );

    jest.clearAllMocks();
    mockFetch.mockResolvedValue(mockResponse as any);

    await client.initializeAsync();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const url = callArgs[0] as string;
    const options = callArgs[1] as any;

    expect(url).toStartWith(
      'https://api.statsigcdn.com/v1/download_config_specs',
    );

    expect(options.backend).toBe('async_initialize');
  });
});
