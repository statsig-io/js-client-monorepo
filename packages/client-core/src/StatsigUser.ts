import { _DJB2Object } from './Hashing';
import { Log } from './Log';
import { _cloneObject } from './SafeJs';
import type {
  AnyStatsigOptions,
  StatsigEnvironment,
} from './StatsigOptionsCommon';

type StatsigUserPrimitives =
  | string
  | number
  | boolean
  | Array<string>
  | undefined;

export type StatsigUser = {
  userID?: string;
  customIDs?: {
    [key: string]: string | undefined;
    stableID?: string;
  };
  email?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  locale?: string;
  appVersion?: string;
  custom?: Record<string, StatsigUserPrimitives>;
  privateAttributes?: Record<string, StatsigUserPrimitives> | null;
  analyticsOnlyMetadata?: Record<string, string | number | boolean>;
};

export type StatsigUserInternal = StatsigUser & {
  statsigEnvironment: StatsigEnvironment | undefined;
};

export function _normalizeUser(
  original: StatsigUser,
  options?: AnyStatsigOptions | null,
  fallbackEnvironment?: string | null,
): StatsigUserInternal {
  const copy = _cloneObject('StatsigUser', original as StatsigUserInternal);
  if (copy == null) {
    Log.error('Failed to clone user');
    return { statsigEnvironment: undefined };
  }

  if (options != null && options.environment != null) {
    copy.statsigEnvironment = options.environment;
  } else if (fallbackEnvironment != null) {
    copy.statsigEnvironment = { tier: fallbackEnvironment };
  }

  return copy;
}

export function _getFullUserHash(user: StatsigUser | undefined): string | null {
  return user ? _DJB2Object(user) : null;
}
