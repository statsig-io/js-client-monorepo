import { Log } from './Log';
import { SDKType } from './SDKType';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { AnyStatsigOptions } from './StatsigOptionsCommon';

export const EXCEPTION_ENDPOINT = 'https://statsigapi.net/v1/sdk_exception';
const UNKNOWN_ERROR = '[Statsig] UnknownError';

export class ErrorBoundary {
  private _seen = new Set<string>();

  constructor(
    private _sdkKey: string,
    private _options: AnyStatsigOptions | null,
    private _emitter?: StatsigClientEmitEventFunc,
    private _lastSeenError?: Error,
  ) {}

  wrap(instance: unknown, namePrefix?: string): void {
    try {
      const obj = instance as Record<string, unknown>;

      _getAllInstanceMethodNames(obj).forEach((name) => {
        const original = obj[name] as (...args: unknown[]) => unknown;
        if ('$EB' in original) {
          return;
        }

        obj[name] = (...args: unknown[]) => {
          return this._capture(
            namePrefix ? `${namePrefix}:${name}` : name,
            () => original.apply(instance, args),
          );
        };
        (obj[name] as { $EB: boolean }).$EB = true;
      });
    } catch (err) {
      this._onError('eb:wrap', err);
    }
  }

  logError(tag: string, error: unknown): void {
    this._onError(tag, error);
  }

  logDroppedEvents(
    count: number,
    reason: string,
    metadata?: Record<string, unknown>,
  ): void {
    const extra: Record<string, string> = {
      eventCount: String(count),
    };

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        extra[key] = String(value);
      });
    }
    this._onError(
      `statsig::log_event_dropped_event_count`,
      new Error(reason),
      true,
      extra,
    );
  }

  logEventRequestFailure(
    count: number,
    reason: string,
    flushType: string,
    statusCode: number,
  ): void {
    const extra: Record<string, string> = {
      eventCount: String(count),
      flushType: flushType,
      statusCode: String(statusCode),
    };
    this._onError(`statsig::log_event_failed`, new Error(reason), true, extra);
  }

  getLastSeenErrorAndReset(): Error | null {
    const tempError = this._lastSeenError;
    this._lastSeenError = undefined;
    return tempError ?? null;
  }

  attachErrorIfNoneExists(error: unknown): void {
    if (this._lastSeenError) {
      return;
    }
    this._lastSeenError = _resolveError(error);
  }

  private _capture(tag: string, task: () => unknown): unknown {
    try {
      const res = task();
      if (res && res instanceof Promise) {
        return res.catch((err) => this._onError(tag, err));
      }
      return res;
    } catch (error) {
      this._onError(tag, error);
      return null;
    }
  }

  private _onError(
    tag: string,
    error: unknown,
    bypassDedupe = false,
    extra?: Record<string, string>,
  ) {
    try {
      Log.warn(`Caught error in ${tag}`, { error });

      const impl = async () => {
        const unwrapped = (error ? error : Error(UNKNOWN_ERROR)) as unknown;
        const isError = unwrapped instanceof Error;
        const name = isError ? unwrapped.name : 'No Name';

        const resolvedError = _resolveError(unwrapped);

        this._lastSeenError = resolvedError;
        if (!bypassDedupe && this._seen.has(name)) {
          return;
        }

        this._seen.add(name);

        if (this._options?.networkConfig?.preventAllNetworkTraffic) {
          this._emitter?.({
            name: 'error',
            error,
            tag,
          });
          return;
        }

        const sdkType = SDKType._get(this._sdkKey);
        const statsigMetadata = StatsigMetadataProvider.get();
        const info = isError ? unwrapped.stack : _getDescription(unwrapped);
        const body = {
          tag,
          exception: name,
          info,
          extra,
          statsigOptions: _getStatsigOptionLoggingCopy(this._options),
          ...{ ...statsigMetadata, sdkType },
        };

        const func = this._options?.networkConfig?.networkOverrideFunc ?? fetch;
        await func(EXCEPTION_ENDPOINT, {
          method: 'POST',
          headers: {
            'STATSIG-API-KEY': this._sdkKey,
            'STATSIG-SDK-TYPE': String(sdkType),
            'STATSIG-SDK-VERSION': String(statsigMetadata.sdkVersion),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        this._emitter?.({
          name: 'error',
          error,
          tag,
        });
      };

      impl()
        .then(() => {
          /* noop */
        })
        .catch(() => {
          /* noop */
        });
    } catch (_error) {
      /* noop */
    }
  }
}

function _resolveError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  } else if (typeof error === 'string') {
    return new Error(error);
  } else {
    return new Error('An unknown error occurred.');
  }
}

function _getDescription(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return UNKNOWN_ERROR;
  }
}

function _getAllInstanceMethodNames(
  instance: Record<string, unknown>,
): string[] {
  const names = new Set<string>();

  let proto = Object.getPrototypeOf(instance) as Record<string, unknown>;
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto)
      .filter((prop) => typeof proto?.[prop] === 'function')
      .forEach((name) => names.add(name));
    proto = Object.getPrototypeOf(proto) as Record<string, unknown>;
  }

  return Array.from(names);
}

function _getStatsigOptionLoggingCopy(
  options: AnyStatsigOptions | null,
): Record<string, unknown> {
  if (!options) {
    return {};
  }

  const loggingCopy: Record<string, unknown> = {};

  Object.keys(options).forEach((key) => {
    const option = key as keyof AnyStatsigOptions;
    const value = options[option];
    const valueType = typeof value;
    switch (valueType) {
      case 'number':
      case 'bigint':
      case 'boolean':
        loggingCopy[String(option)] = value;
        break;
      case 'string':
        if ((value as string).length < 50) {
          loggingCopy[String(option)] = value;
        } else {
          loggingCopy[String(option)] = 'set';
        }
        break;
      case 'object':
        if (option === 'environment') {
          loggingCopy['environment'] = value;
        } else if (option === 'networkConfig') {
          loggingCopy['networkConfig'] = value;
        } else {
          loggingCopy[String(option)] = value != null ? 'set' : 'unset';
        }
        break;
      default:
      // Ignore other fields
    }
  });

  return loggingCopy;
}
