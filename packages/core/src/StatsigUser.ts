import { StatsigEnvironment } from './StatsigTypes';

type StatsigUserPrimitives =
  | string
  | number
  | boolean
  | Array<string>
  | undefined;

export type StatsigUser = {
  userID?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  locale?: string;
  appVersion?: string;
  custom?: Record<string, StatsigUserPrimitives>;
  privateAttributes?: Record<string, StatsigUserPrimitives>;
  customIDs?: Record<string, string>;
};

export type NormalizedStatsigUser = StatsigUser & {
  statsigEnvironment?: StatsigEnvironment;
};

export function normalizeUser(
  original: StatsigUser,
  environment?: StatsigEnvironment,
): StatsigUser {
  let copy: NormalizedStatsigUser = {};

  try {
    copy = JSON.parse(JSON.stringify(original)) as StatsigUser;
  } catch (error) {
    throw new Error('User object must be convertable to JSON string.');
  }

  if (environment != null) {
    copy.statsigEnvironment = environment;
  }

  return copy;
}
