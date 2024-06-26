import { _DJB2Object } from './Hashing';
import { Log } from './Log';
import type { StatsigEnvironment } from './StatsigOptionsCommon';

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
};

export type StatsigUserInternal = StatsigUser & {
  statsigEnvironment?: StatsigEnvironment;
};

export function _normalizeUser(
  original: StatsigUser,
  environment?: StatsigEnvironment,
): StatsigUser {
  try {
    const copy = JSON.parse(JSON.stringify(original)) as StatsigUserInternal;

    if (environment != null) {
      copy.statsigEnvironment = environment;
    }

    return copy;
  } catch (error) {
    Log.error('Failed to JSON.stringify user');
    return {};
  }
}

export function _getFullUserHash(user: StatsigUser | undefined): string | null {
  return user ? _DJB2Object(user) : null;
}
