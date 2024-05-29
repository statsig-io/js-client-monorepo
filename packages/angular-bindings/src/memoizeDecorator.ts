export function Memoize(
  keyGenerator: (...args: unknown[]) => string,
): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const orignal = descriptor.value as (...args: unknown[]) => unknown;
    const cache = new Map<string, unknown>();

    descriptor.value = function (...args: unknown[]) {
      const key = keyGenerator(...args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = orignal.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}
