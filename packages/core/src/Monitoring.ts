export function Monitored(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  ..._args: unknown[]
) {
  for (const propertyName of Object.getOwnPropertyNames(target.prototype)) {
    const desc = Object.getOwnPropertyDescriptor(
      target.prototype,
      propertyName,
    );
    const isMethod = desc && desc.value instanceof Function;

    if (propertyName === 'constructor' || !isMethod) {
      continue;
    }

    Object.defineProperty(
      target.prototype,
      propertyName,
      _generateDescriptor(propertyName, desc),
    );
  }

  return target;
}

function _generateDescriptor(
  propertyKey: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    try {
      const res = originalMethod.apply(this, args);
      if (res && res instanceof Promise) {
        return res.catch((err) => _onError(propertyKey, err));
      }
      return res;
    } catch (error) {
      _onError(propertyKey, error);
    }
  };

  return descriptor;
}

function _onError(methodName: string, error: unknown) {
  console.warn(`[Statsig]: Caught Error in ${methodName}`, error);
}
