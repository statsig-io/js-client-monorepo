import { captureDiagnostics } from './Diagnostics';
import { ErrorBoundary } from './ErrorBoundary';
import { StatsigClientBase } from './StatsigClientBase';

type Proto = Record<string, unknown> | null;

export function monitorClass(
  errorBoundary: ErrorBoundary,
  instance: object,
): void {
  try {
    _monitorClassImpl(errorBoundary, instance);
  } catch (error) {
    errorBoundary.logError('monitorClass', error);
  }
}

function _monitorFunction<T>(
  errorBoundary: ErrorBoundary,
  tag: string,
  func: () => T,
  instance: unknown,
): T {
  const emitFunc =
    instance instanceof StatsigClientBase
      ? instance['_emit'].bind(instance)
      : undefined;

  return errorBoundary.capture(
    tag,
    () => captureDiagnostics(tag, () => func.apply(instance)),
    emitFunc,
  ) as T;
}

function _getProtoSafe(instance: unknown): Record<string, unknown> | null {
  if (typeof instance === 'object') {
    const proto = Object.getPrototypeOf(instance) as unknown;
    return proto && typeof proto === 'object'
      ? (proto as Record<string, unknown>)
      : null;
  }
  return null;
}

function _getAllInstanceMethodNames(
  instance: Record<string, unknown>,
): string[] {
  const names = new Set<string>();

  let proto = _getProtoSafe(instance);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto)
      .filter((prop) => typeof proto?.[prop] === 'function')
      .forEach((name) => names.add(name));
    proto = Object.getPrototypeOf(proto) as Proto;
  }

  return Array.from(names);
}

function _getAllStaticMethodNames(instance: object): string[] {
  const names = new Set<string>();

  const proto = _getProtoSafe(instance);
  Object.getOwnPropertyNames(proto?.constructor || {})
    .filter((prop) => {
      if (prop === 'caller' || prop === 'arguments' || prop === 'callee') {
        return false;
      }

      return (
        typeof (proto?.constructor as unknown as Record<string, unknown>)?.[
          prop
        ] === 'function'
      );
    })
    .forEach((name) => names.add(name));

  return Array.from(names);
}

function _monitorClassImpl(errorBoundary: ErrorBoundary, instance: object) {
  const obj = instance as Record<string, unknown>;

  for (const method of _getAllInstanceMethodNames(obj)) {
    if (method === 'constructor') {
      continue;
    }

    const original = obj[method] as (...args: unknown[]) => unknown;
    obj[method] = function (...args: unknown[]) {
      return _monitorFunction(
        errorBoundary,
        method,
        () => original.apply(this, args) as unknown,
        instance,
      );
    };
  }

  for (const method of _getAllStaticMethodNames(obj)) {
    const original = (obj?.constructor as unknown as Record<string, unknown>)?.[
      method
    ] as (...args: unknown[]) => unknown;
    (obj?.constructor as unknown as Record<string, unknown>)[method] =
      function (...args: unknown[]) {
        return _monitorFunction(
          errorBoundary,
          `${obj.constructor.name}.${method}`,
          () => original.apply(obj.constructor, args) as unknown,
          instance,
        );
      };
  }
}
