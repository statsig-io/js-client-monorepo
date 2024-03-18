export type Flatten<T> = {
  [K in keyof T]: T[K];

  // Intentional: This is a utility type
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
