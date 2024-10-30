const CURLY_AND_SQUARE_BRACKET_SIZE = 2; // [] for array, {} for object
const APPROX_ADDITIONAL_SIZE = 1; // additional size for comma and stuff

export const _fastApproxSizeOf = (
  obj: Record<string, unknown> | Array<unknown>,
  max: number,
): number => {
  let size = 0;
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = (obj as any)[key];
    size += key.length;

    if (typeof value === 'object' && value !== null) {
      size += _fastApproxSizeOf(value, max) + CURLY_AND_SQUARE_BRACKET_SIZE;
    } else {
      size += String(value).length + APPROX_ADDITIONAL_SIZE;
    }

    if (size >= max) {
      // exit early if we've exceeded the max
      return size;
    }
  }

  return size;
};
