import { DcsResponseString } from 'statsig-test-helpers';

import { StatsigCloudflareClient } from '../provider/cloudflare';

describe('StatsigCloudflareClient', () => {
  const sdkKey = 'test-sdk-key';
  const kvKey = 'statsig-kvKey';
  let client: StatsigCloudflareClient;
  let mockKvBinding: { get: jest.Mock };
  let mockDataAdapterSetData: jest.SpyInstance;
  let mockInitializeSync: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StatsigCloudflareClient(sdkKey);
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
  });

  describe('when KV returns specs data', () => {
    it('should initialize with sync', async () => {
      const mockSpecs = DcsResponseString;
      mockKvBinding.get.mockResolvedValue(mockSpecs);

      const result = await client.initializeFromKV(mockKvBinding, kvKey);

      expect(mockDataAdapterSetData).toHaveBeenCalledWith(mockSpecs);
      expect(mockDataAdapterSetData).toHaveBeenCalledTimes(1);
      expect(mockInitializeSync).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('should return error when KV binding is null', async () => {
      const result = await client.initializeFromKV(null as any, kvKey);

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toBe('Invalid KV binding provided');
      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
    });

    it('should return error when KV binding is undefined', async () => {
      const result = await client.initializeFromKV(undefined as any, kvKey);

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toBe('Invalid KV binding provided');
    });

    it('should return error when KV key is empty string', async () => {
      const result = await client.initializeFromKV(mockKvBinding, '');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toBe('Invalid KV key provided');
      expect(mockKvBinding.get).not.toHaveBeenCalled();
    });

    it('should return error when KV key is whitespace only', async () => {
      const result = await client.initializeFromKV(mockKvBinding, '   ');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toBe('Invalid KV key provided');
      expect(mockKvBinding.get).not.toHaveBeenCalled();
    });

    it('should return error when KV key is not a string', async () => {
      const result = await client.initializeFromKV(mockKvBinding, 123 as any);

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toBe('Invalid KV key provided');
    });
  });

  describe('when KV returns null, undefined, or empty', () => {
    it('should return error when KV returns null', async () => {
      mockKvBinding.get.mockResolvedValue(null);

      const result = await client.initializeFromKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);
      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toContain('Failed to fetch specs');
      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
    });

    it('should return error when KV returns undefined', async () => {
      mockKvBinding.get.mockResolvedValue(undefined);

      const result = await client.initializeFromKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);
      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
    });

    it('should return error when KV returns empty string', async () => {
      mockKvBinding.get.mockResolvedValue('');

      const result = await client.initializeFromKV(mockKvBinding, kvKey);

      expect(mockKvBinding.get).toHaveBeenCalledWith(kvKey);
      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
    });
  });

  describe('when KV fetch fails', () => {
    it('should return error when KV get throws', async () => {
      const kvError = new Error('KV connection failed');
      mockKvBinding.get.mockRejectedValue(kvError);

      const result = await client.initializeFromKV(mockKvBinding, kvKey);

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('message');
      expect(result.error?.message).toContain('Failed to fetch specs');
      expect(mockDataAdapterSetData).not.toHaveBeenCalled();
      expect(mockInitializeSync).not.toHaveBeenCalled();
    });
  });
});
