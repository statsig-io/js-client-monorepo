import { _DJB2 } from './Hashing';
import { StatsigUser } from './StatsigUser';

export type CustomCacheKeyGenerator = (
  sdkKey: string,
  user: StatsigUser,
) => string;

export function _getUserStorageKey(
  sdkKey: string,
  user: StatsigUser,
  customKeyGenerator?: CustomCacheKeyGenerator,
): string {
  if (customKeyGenerator) {
    return customKeyGenerator(sdkKey, user);
  }

  const cids = user && user.customIDs ? user.customIDs : {};

  const parts = [
    `uid:${user?.userID ?? ''}`,
    `cids:${Object.keys(cids)
      .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
      .map((key) => `${key}-${cids[key]}`)
      .join(',')}`,
    `k:${sdkKey}`,
  ];

  return _DJB2(parts.join('|'));
}

export function _getStorageKey(
  sdkKey: string,
  user?: StatsigUser,
  customKeyGenerator?: CustomCacheKeyGenerator,
): string {
  if (user) {
    return _getUserStorageKey(sdkKey, user, customKeyGenerator);
  }

  return _DJB2(`k:${sdkKey}`);
}
