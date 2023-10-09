import { Log } from './Log';

const SUPPORTS_PERFORMANCE_API =
  typeof performance !== 'undefined' && typeof performance.mark !== 'undefined';

let markers: PerformanceMeasure[] = [];

export function captureDiagnostics(func: string, task: () => unknown): unknown {
  Diagnostics.mark(`${func}:start`);
  const result = task();

  const markEnd = () => {
    Diagnostics.mark(`${func}:end`);
    maybeFlush(`${func}:end`);
  };

  if (result && result instanceof Promise) {
    return result.finally(() => markEnd());
  } else {
    markEnd();
  }

  return result;
}

export abstract class Diagnostics {
  static mark(tag: string, metadata?: Record<string, unknown>): void {
    if (!SUPPORTS_PERFORMANCE_API) {
      return;
    }

    const marker = performance.mark(tag, { detail: metadata });
    markers.push(marker);
  }

  static flush(): void {
    const resources = performance
      .getEntriesByType('resource')
      .filter((resource) =>
        resource.name.startsWith('https://api.statsig.com'),
      );

    const payload = {
      markers,
      resources,
    };

    Log.debug('Diagnostics', payload, JSON.stringify(payload));
    markers = [];
  }
}

function maybeFlush(tag: string): void {
  if (tag.startsWith('initialize:')) {
    Diagnostics.flush();
  }
}
