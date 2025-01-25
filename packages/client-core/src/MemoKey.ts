import { AnyEvaluationOptions } from './EvaluationOptions';

export const MemoPrefix = {
  _gate: 'g',
  _dynamicConfig: 'c',
  _experiment: 'e',
  _layer: 'l',
  _paramStore: 'p',
} as const;

export type MemoPrefix = (typeof MemoPrefix)[keyof typeof MemoPrefix];

const EXIST_KEYS = new Set<string>([
  // Add keys that should be memoized based only on their existence, not their value
]);

const DO_NOT_MEMO_KEYS = new Set<string>([
  // Add keys that if exist, should not be memoized
  'userPersistedValues',
]);

export function createMemoKey(
  prefix: MemoPrefix,
  name: string,
  options?: AnyEvaluationOptions,
): string | undefined {
  let cacheKey = `${prefix}|${name}`;

  if (!options) {
    return cacheKey;
  }

  for (const key of Object.keys(options)) {
    if (DO_NOT_MEMO_KEYS.has(key)) {
      return undefined;
    }

    if (EXIST_KEYS.has(key)) {
      cacheKey += `|${key}=true`;
    } else {
      cacheKey += `|${key}=${options[key as keyof AnyEvaluationOptions]}`;
    }
  }

  return cacheKey;
}
