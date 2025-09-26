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

describe('StatsigEdgeClient - initializeFromCDN', () => {
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
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromCDN(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
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
    expect(result).toEqual({
      success: true,
      fromCache: true,
    });
  });

  it('should return error when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await client.initializeFromCDN(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
    );

    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Failed to retrieve config specs from CDN'),
      sourceUrl: 'https://test-cdn.example.com/config.json',
    });

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
  });

  it('should return error when response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromCDN(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
    );

    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Retrieval from storage returned status 404'),
      sourceUrl: 'https://test-cdn.example.com/config.json',
    });

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
  });

  it('should return error when JSON parsing fails', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromCDN(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
    );
    expect(mockResponse.json).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Config specs were not parsed successfully.'),
      sourceUrl: 'https://test-cdn.example.com/config.json',
    });

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
  });

  it('should handle different HTTP error status codes', async () => {
    const mockResponse = {
      ok: false,
      status: 403,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromCDN(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
    );

    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Retrieval from storage returned status 403'),
      sourceUrl: 'https://test-cdn.example.com/config.json',
    });

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
  });

  it('should handle 500 server error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeFromCDN(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
    );

    expect(result).toEqual({
      duration: expect.any(Number),
      source: 'Bootstrap',
      success: false,
      error: new Error('Retrieval from storage returned status 500'),
      sourceUrl: 'https://test-cdn.example.com/config.json',
    });

    const mockClient = (client as any)._client;
    expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
    expect(mockClient.initializeSync).not.toHaveBeenCalled();
  });
});
