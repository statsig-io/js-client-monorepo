import { captureDiagnostics } from './Diagnostics';
import { errorBoundary } from './ErrorBoundary';
import { StatsigClientBase } from './StatsigClientBase';

export function monitorClass<T extends new (...args: any[]) => any>(
  target: T,
  instance: unknown,
): void {
  const methods = Object.getOwnPropertyNames(target.prototype);
  const obj = instance as Record<string, unknown>;

  for (const method of methods) {
    if (method === 'constructor' || typeof obj[method] !== 'function') {
      continue;
    }

    const original = obj[method] as (...args: unknown[]) => unknown;
    obj[method] = function (...args: unknown[]) {
      return monitorFunction(
        method,
        () => original.apply(this, args) as unknown,
        instance,
      );
    };
  }
}

export function monitorFunction<T>(
  tag: string,
  func: () => T,
  instance: unknown,
): T {
  const client =
    instance instanceof StatsigClientBase
      ? (instance as StatsigClientBase)
      : undefined;

  return errorBoundary(
    tag,
    () => captureDiagnostics(tag, () => func.apply(instance)),
    client,
  ) as T;
}
