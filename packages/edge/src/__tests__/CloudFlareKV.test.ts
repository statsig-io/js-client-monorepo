import { DcsResponseString } from 'statsig-test-helpers';

import { StatsigEdgeClient } from '../StatsigEdgeClient';

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

describe('StatsigEdgeClient - initializeFromCloudflareKV', () => {
  const sdkKey = 'test-sdk-key';
  const kvKey = 'statsig-kvKey';
  let client: StatsigEdgeClient;
  let mockKvBinding: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigEdgeClient(sdkKey);
    mockKvBinding = {
      get: jest.fn(),
    };
  });

  describe('when KV returns specs data', () => {
    it('should initialize with sync and disable background refresh', async () => {
      const mockSpecs = DcsResponseString;
      mockKvBinding.get.mockResolvedValue(mockSpecs);

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      const mockClient = (client as any)._client;
      expect(mockClient.dataAdapter.setData).toHaveBeenCalledWith(mockSpecs);
      expect(mockClient.dataAdapter.setData).toHaveBeenCalledTimes(1);

      expect(mockClient.initializeSync).toHaveBeenCalledWith({
        disableBackgroundCacheRefresh: true,
      });
      expect(mockClient.initializeSync).toHaveBeenCalledTimes(1);
      expect(mockClient.initializeAsync).not.toHaveBeenCalled();
    });

    it('should handle empty string specs by falling back to async initialization', async () => {
      mockKvBinding.get.mockResolvedValue('');

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);

      const mockClient = (client as any)._client;
      expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
      expect(mockClient.initializeSync).not.toHaveBeenCalled();
      expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('when KV returns null or undefined', () => {
    it('should fall back to async initialization when KV returns null', async () => {
      mockKvBinding.get.mockResolvedValue(null);

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);

      const mockClient = (client as any)._client;
      expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
      expect(mockClient.initializeSync).not.toHaveBeenCalled();
      expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    });

    it('should fall back to async initialization when KV returns undefined', async () => {
      mockKvBinding.get.mockResolvedValue(undefined);

      await client.initializeFromCloudflareKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);

      const mockClient = (client as any)._client;
      expect(mockClient.dataAdapter.setData).not.toHaveBeenCalled();
      expect(mockClient.initializeSync).not.toHaveBeenCalled();
      expect(mockClient.initializeAsync).toHaveBeenCalledTimes(1);
    });
  });
});
