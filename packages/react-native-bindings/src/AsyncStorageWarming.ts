import {
  DataAdapterCachePrefix,
  StatsigClientInterface,
  StatsigDataAdapter,
  StatsigDataAdapterResult,
  Storage,
  typedJsonParse,
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

      const result = typedJsonParse<StatsigDataAdapterResult>(
        cache,
        'source',
        'Failed to parse cached result',
      );

      return result ? { ...result, source: 'Cache' } : null;
    }),
  );

  adapter._setInMemoryCache(results);
}
