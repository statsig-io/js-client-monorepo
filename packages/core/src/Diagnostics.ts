const SUPPORTS_PERFORMANCE_API =
  typeof performance !== 'undefined' && typeof performance.mark !== 'undefined';

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
  static mark(tag: string): PerformanceMark | null {
    if (!SUPPORTS_PERFORMANCE_API) {
      return null;
    }

    return performance.mark(tag);
  }

  static span(
    start: PerformanceMark | null,
    end: PerformanceMark | null,
  ): void {
    if (start == null || end == null || !SUPPORTS_PERFORMANCE_API) {
      return;
    }

    performance.measure(`${start.name} -> ${end.name}`, start.name, end.name);
  }
}
