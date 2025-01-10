import { AnyEvaluationOptions } from './EvaluationOptions';

const EXIST_KEYS = new Set<string>([
  // Add keys that should be memoized based only on their existence, not their value
]);

const DO_NOT_MEMO_KEYS = new Set<string>([
  // Add keys that if exist, should not be memoized
  'userPersistedValues',
]);

export function createMemoKey(
  name: string,
  options?: AnyEvaluationOptions,
): string | undefined {
  let cacheKey = name;

  if (!options) {
    return cacheKey;
  }

  for (const key of Object.keys(options)) {
    if (DO_NOT_MEMO_KEYS.has(key)) {
      return undefined;
    }

    if (EXIST_KEYS.has(key)) {
      cacheKey += `${key}=true`;
    } else {
      cacheKey += `${key}=${options[key as keyof AnyEvaluationOptions]}`;
    }
  }

  return cacheKey;
}
