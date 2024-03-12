/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export type TestPromise<T> = Promise<T> & {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: T | Error) => void;
};

export function CreateTestPromise<T>(): TestPromise<T> {
  let resolver: any;
  let rejector: any;

  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  }) as unknown as TestPromise<T>;

  promise.resolve = resolver;
  promise.reject = rejector;

  return promise as unknown as TestPromise<T>;
}
