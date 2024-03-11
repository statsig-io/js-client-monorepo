import {
  DataAdapterCachePrefix,
  Log,
  StatsigClientInterface,
  StatsigDataAdapter,
  StatsigDataAdapterResult,
  Storage,
} from '@statsig/client-core';

export type StatsigAsyncCacheWarming = {
  result: Promise<void>;
};

export function warmCachingFromAsyncStorage(
  client: StatsigClientInterface,
): StatsigAsyncCacheWarming {
  return {
    result: _loadCacheAsync(client.getDataAdapter()),
  };
}

async function _loadCacheAsync(adapter: StatsigDataAdapter): Promise<void> {
  const keys = await Storage.getAllKeys();
  const results: Record<string, StatsigDataAdapterResult> = {};

  await Promise.all(
    keys.map(async (key) => {
      if (!key.startsWith(DataAdapterCachePrefix)) {
        return;
      }

      const cache = await Storage.getItem(key);
      if (!cache) {
        return;
      }

      try {
        const result = JSON.parse(cache) as StatsigDataAdapterResult;
        results[key] = { ...result, source: 'Cache' };
      } catch (e) {
        Log.error('Failed to parse cached result');
        return;
      }
    }),
  );

  adapter._setInMemoryCache(results);
}
