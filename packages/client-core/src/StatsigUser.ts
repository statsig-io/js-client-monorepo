import { DJB2 } from './Hashing';
import type { StatsigEnvironment } from './StatsigOptionsCommon';

type StatsigUserPrimitives =
  | string
  | number
  | boolean
  | Array<string>
  | undefined;

export type StatsigUser = (
  | { userID: string }
  | { customIDs: Record<string, string> }
) & {
  userID?: string;
  customIDs?: Record<string, string>;
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

export function normalizeUser(
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
    throw new Error('User object must be convertable to JSON string.');
  }
}

export function getUserStorageKey(sdkKey: string, user?: StatsigUser): string {
  return DJB2(JSON.stringify(_getSortedObject({ sdkKey, user })));
}

function _getSortedObject(
  object: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (object == null) {
    return null;
  }
  const keys = Object.keys(object).sort();
  const sortedObject: Record<string, unknown> = {};
  keys.forEach((key) => {
    let value = object[key];
    if (value instanceof Object) {
      value = _getSortedObject(value as Record<string, unknown>);
    }

    sortedObject[key] = value;
  });
  return sortedObject;
}
