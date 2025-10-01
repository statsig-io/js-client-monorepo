import { DcsResponse } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

jest.mock('@vercel/edge-config', () => ({
  getAll: jest.fn(),
}));

describe('StatsigEdgeClient - initializeFromVercel', () => {
  let client: StatsigEdgeClient;
  let mockGetAll: jest.MockedFunction<any>;
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;
  let mockInitializeAsync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigEdgeClient('test-sdk-key');
    const { getAll } = jest.requireMock('@vercel/edge-config');
    mockGetAll = getAll;

    mockDataAdapterSetData = jest.spyOn(client.dataAdapter, 'setData');
    mockInitializeSync = jest.spyOn(client, 'initializeSync').mockReturnValue({
      success: true,
      duration: 0,
      source: 'Bootstrap' as any,
      error: null,
      sourceUrl: null,
    });
    mockInitializeAsync = jest
      .spyOn(client, 'initializeAsync')
      .mockResolvedValue({
        success: true,
        duration: 0,
        source: 'Bootstrap' as any,
        error: null,
        sourceUrl: null,
      });
  });

  it('should initialize successfully when specs are available', async () => {
    const mockSpecs = DcsResponse;
    const mockConfigData = { 'test-config-key': mockSpecs };

    mockGetAll.mockResolvedValue(mockConfigData);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).toHaveBeenCalledWith(
      JSON.stringify(mockSpecs),
    );
    expect(mockInitializeSync).toHaveBeenCalledTimes(1);
    expect(mockInitializeSync).toHaveBeenCalledWith({
      disableBackgroundCacheRefresh: true,
    });
    expect(mockInitializeAsync).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });

  it('should fallback to async initialization when no specs are available', async () => {
    mockGetAll.mockResolvedValue(null);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(mockInitializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });

  it('should fallback to async initialization when config key is not found', async () => {
    const mockConfigData = { 'other-config-key': DcsResponse };
    mockGetAll.mockResolvedValue(mockConfigData);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(mockInitializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });

  it('should handle undefined config data', async () => {
    mockGetAll.mockResolvedValue(undefined);

    const result = await client.initializeFromVercel('test-config-key');

    expect(mockGetAll).toHaveBeenCalledTimes(1);

    expect(mockDataAdapterSetData).not.toHaveBeenCalled();
    expect(mockInitializeSync).not.toHaveBeenCalled();
    expect(mockInitializeAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      duration: 0,
      source: 'Bootstrap',
      error: null,
      sourceUrl: null,
    });
  });
});
