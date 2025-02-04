import { Log } from './Log';

/**
 *
 * @param {string} data The values to parse into T
 * @param {string} guard A field that must exists on the parsed object for the parse to be valid
 * @param {string} error An error to print via Log.error() when parsing fails
 * @returns {T | null} The parse object T or null if it failed
 */
export function _typedJsonParse<T>(
  data: string,
  guard: string,
  typeName: string,
): T | null {
  try {
    const result = JSON.parse(data) as unknown;

    if (
      result &&
      typeof result === 'object' &&
      guard in (result as Record<string, unknown>)
    ) {
      return result as T;
    }
  } catch {
    // noop
  }

  Log.error(`Failed to parse ${typeName}`);
  return null;
}
