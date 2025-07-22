type Primitive =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function';

export type Flatten<T> = {
  [K in keyof T]: T[K];

  // Intentional: This is a utility type
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export function _typeOf(input: unknown): Primitive | 'array' {
  return Array.isArray(input) ? 'array' : typeof input;
}

export function _isTypeMatch<T>(a: unknown, b: unknown): a is T {
  const typeOf = (x: unknown) =>
    Array.isArray(x) ? 'array' : x === null ? 'null' : typeof x;
  return typeOf(a) === typeOf(b);
}
