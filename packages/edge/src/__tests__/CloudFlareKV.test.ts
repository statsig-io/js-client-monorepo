import { DcsResponseString } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

describe('StatsigEdgeClient - initializeFromCloudflareKV', () => {
  const sdkKey = 'test-sdk-key';
  const kvKey = 'statsig-kvKey';
  let client: StatsigEdgeClient;
  let mockKvBinding: { get: jest.Mock };
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;
  let mockInitializeAsync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigEdgeClient(sdkKey);
    mockKvBinding = {
      get: jest.fn(),
    };

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

  describe('when KV returns specs data', () => {
    it('should initialize with sync and disable background refresh', async () => {
      const mockSpecs = DcsResponseString;
      mockKvBinding.get.mockResolvedValue(mockSpecs);

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockDataAdapterSetData).toHaveBeenCalledWith(mockSpecs);
      expect(mockDataAdapterSetData).toHaveBeenCalledTimes(1);

      expect(mockInitializeSync).toHaveBeenCalledWith({
        disableBackgroundCacheRefresh: true,
      });
      expect(mockInitializeSync).toHaveBeenCalledTimes(1);
      expect(mockInitializeAsync).not.toHaveBeenCalled();
    });

    it('should handle empty string specs by falling back to async initialization', async () => {
      mockKvBinding.get.mockResolvedValue('');

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);

      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
      expect(mockInitializeAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('when KV returns null or undefined', () => {
    it('should fall back to async initialization when KV returns null', async () => {
      mockKvBinding.get.mockResolvedValue(null);

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);

      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
      expect(mockInitializeAsync).toHaveBeenCalledTimes(1);
    });

    it('should fall back to async initialization when KV returns undefined', async () => {
      mockKvBinding.get.mockResolvedValue(undefined);

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);

      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
      expect(mockInitializeAsync).toHaveBeenCalledTimes(1);
    });
  });
});
