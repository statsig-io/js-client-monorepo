export class TestPromise<T> extends Promise<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: T | Error) => void;

  initialCallStack: Error['stack'];

  private constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason: T | Error) => void,
    ) => void,
  ) {
    let resolver: ((value: T | PromiseLike<T>) => void) | null = null;
    let rejector: ((reason: T | Error) => void) | null = null;

    super((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
      return executor(resolve, reject);
    });

    if (!resolver || !rejector) {
      throw new Error('Resolver and Rejector should be set at this point.');
    }

    this.resolve = resolver;
    this.reject = rejector;

    this.initialCallStack = Error().stack?.split('\n').slice(2).join('\n');
  }

  static create<T>(): TestPromise<T> {
    return new TestPromise(() => {
      // noop
    });
  }
}
