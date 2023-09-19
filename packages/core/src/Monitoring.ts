import { captureDiagnostics } from './Diagnostics';
import { errorBoundary } from './ErrorBoundary';

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
    errorBoundary(propertyKey, () =>
      captureDiagnostics(() => originalMethod.apply(this, args)),
    );
  };

  return descriptor;
}
