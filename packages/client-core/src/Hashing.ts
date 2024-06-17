import { _typeOf } from './TypingUtils';

export const _DJB2 = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const character = value.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return String(hash >>> 0);
};

export const _DJB2Object = (
  value: Record<string, unknown> | null,
  maxLevels?: number,
): string => {
  return _DJB2(JSON.stringify(_getSortedObject(value, maxLevels)));
};

export const _getSortedObject = (
  object: Record<string, unknown> | null,
  maxDepth: number | undefined,
): Record<string, unknown> | null => {
  if (object == null) {
    return null;
  }
  const keys = Object.keys(object).sort();
  const sortedObject: Record<string, unknown> = {};
  keys.forEach((key) => {
    const value = object[key];

    if (maxDepth === 0 || _typeOf(value) !== 'object') {
      sortedObject[key] = value;
      return;
    }

    sortedObject[key] = _getSortedObject(
      value as Record<string, unknown>,
      maxDepth != null ? maxDepth - 1 : maxDepth,
    );
  });
  return sortedObject;
};
