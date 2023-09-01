import { StatsigOptions } from './StatsigOptions';

type StatsigUserPrimitives =
  | string
  | number
  | boolean
  | Array<string>
  | undefined;

export type StatsigUser = {
  userID?: string | number;
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

export function normalizeUser(
  options: StatsigOptions,
  original: StatsigUser,
): StatsigUser {
  let copy: StatsigUser & {
    statsigEnvironment?: StatsigOptions['environment'];
  } = {};

  try {
    copy = JSON.parse(JSON.stringify(original)) as StatsigUser;
  } catch (error) {
    throw new Error('User object must be convertable to JSON string.');
  }

  if (options.environment != null) {
    copy.statsigEnvironment = options.environment;
  }

  return copy;
}
