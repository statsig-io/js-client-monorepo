import { DcsResponse } from 'statsig-test-helpers';

import { StatsigServerlessClient } from '../StatsigServerlessClient';

global.fetch = jest.fn();

describe('StatsigEdgeClient - initializeFromCDN', () => {
  let client: StatsigServerlessClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigServerlessClient('test-sdk-key');
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    mockDataAdapterSetData = jest.spyOn(client.dataAdapter, 'setData');
    mockInitializeSync = jest.spyOn(client, 'initializeSync').mockReturnValue({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });

  it('should initialize successfully when data is available', async () => {
    const mockData = DcsResponse;
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeViaURL(
      'https://test-cdn.example.com/config.json',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-cdn.example.com/config.json',
    );
    expect(mockResponse.json).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).toHaveBeenCalledWith(
      JSON.stringify(mockData),
    );
    expect(mockInitializeSync).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });

  it('should return error when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await client.initializeViaURL(
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
  });

  it('should return error when response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeViaURL(
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
  });

  it('should return error when JSON parsing fails', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeViaURL(
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
      error: new Error('Config specs were not parsed successfully'),

      sourceUrl: 'https://test-cdn.example.com/config.json',
    });

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
  });

  it('should handle different HTTP error status codes', async () => {
    const mockResponse = {
      ok: false,
      status: 403,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeViaURL(
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
  });

  it('should handle 500 server error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };

    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await client.initializeViaURL(
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

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
  });
});
