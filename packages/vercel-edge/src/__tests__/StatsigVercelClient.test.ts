import { DcsResponse } from 'statsig-test-helpers';

import { StatsigVercelClient } from '../StatsigVercelClient';

jest.mock('@vercel/edge-config', () => ({
  get: jest.fn(),
}));

describe('StatsigVercelClient - initializeFromVercel', () => {
  let client: StatsigVercelClient;
  let mockGet: jest.MockedFunction<any>;
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigVercelClient('test-sdk-key');
    const { get } = jest.requireMock('@vercel/edge-config');
    mockGet = get;

    mockDataAdapterSetData = jest.spyOn(client.dataAdapter, 'setData');
    mockInitializeSync = jest.spyOn(client, 'initializeSync').mockReturnValue({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });

  it('should initialize successfully when specs are available', async () => {
    const mockSpecs = DcsResponse;

    mockGet.mockResolvedValue(mockSpecs);

    const result = await client.initializeFromEdgeConfig('test-config-key');

    expect(mockGet).toHaveBeenCalledWith('test-config-key');
    expect(mockGet).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).toHaveBeenCalledWith(
      JSON.stringify(mockSpecs),
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

  it('should return error when no specs are available', async () => {
    mockGet.mockResolvedValue(null);

    const result = await client.initializeFromEdgeConfig('test-config-key');

    expect(mockGet).toHaveBeenCalledWith('test-config-key');
    expect(mockGet).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.source).toBe('Bootstrap');
    expect(result.error).toHaveProperty('message');
    expect(result.error?.message).toBe(
      'Failed to fetch specs from Vercel Edge Config with key: test-config-key',
    );
    expect(result.sourceUrl).toBeNull();
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle undefined config data', async () => {
    mockGet.mockResolvedValue(undefined);

    const result = await client.initializeFromEdgeConfig('test-config-key');

    expect(mockGet).toHaveBeenCalledWith('test-config-key');
    expect(mockGet).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.source).toBe('Bootstrap');
    expect(result.error).toHaveProperty('message');
    expect(result.error?.message).toBe(
      'Failed to fetch specs from Vercel Edge Config with key: test-config-key',
    );
    expect(result.sourceUrl).toBeNull();
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle fetch errors', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const result = await client.initializeFromEdgeConfig('test-config-key');

    expect(mockGet).toHaveBeenCalledWith('test-config-key');
    expect(mockGet).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.source).toBe('Bootstrap');
    expect(result.error).toHaveProperty('message');
    expect(result.error?.message).toBe(
      'Failed to fetch specs from Vercel Edge Config',
    );
    expect(result.sourceUrl).toBeNull();
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle string specs data', async () => {
    const mockSpecs = JSON.stringify(DcsResponse);

    mockGet.mockResolvedValue(mockSpecs);

    const result = await client.initializeFromEdgeConfig('test-config-key');

    expect(mockGet).toHaveBeenCalledWith('test-config-key');
    expect(mockGet).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).toHaveBeenCalledWith(mockSpecs);
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
});
