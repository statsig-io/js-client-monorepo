import { Log } from './Log';

/**
 *
 * @param {string} data The values to parse into T
 * @param {string} guard A field that must exists on the parsed object for the parse to be valid
 * @param {string} error An error to print via Log.error() when parsing fails
 * @returns {T | null} The parse object T or null if it failed
 */
export function typedJsonParse<T>(
  data: string,
  guard: string,
  error: string,
): T | null {
  try {
    const result = JSON.parse(data) as unknown;
    if (
      typeof result === 'object' &&
      guard in (result as Record<string, unknown>)
    ) {
      return result as T;
    }
    return result as T;
  } catch {
    // noop
  }

  Log.error(error);
  return null;
}
