// import { PerformanceMark, performance } from 'perf_hooks';

export function captureDiagnostics(func: string, task: () => unknown): unknown {
  const start = Diagnostics.mark(`${func}-start`);
  const result = task();

  const markEnd = () => {
    const end = Diagnostics.mark(`${func}-end`);
    Diagnostics.span(start, end);
  };

  if (result && result instanceof Promise) {
    return result.finally(() => markEnd());
  } else {
    markEnd();
  }

  return result;
}

export abstract class Diagnostics {
  static mark(tag: string): PerformanceMark {
    return performance.mark(tag);
  }

  static span(start: PerformanceMark, end: PerformanceMark): void {
    performance.measure(`${start.name} -> ${end.name}`, start.name, end.name);
  }
}
