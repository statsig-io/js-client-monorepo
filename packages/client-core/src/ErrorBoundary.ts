import { Log } from './Log';
import { SDKType } from './SDKType';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { AnyStatsigOptions } from './StatsigOptionsCommon';

export const EXCEPTION_ENDPOINT = 'https://statsigapi.net/v1/sdk_exception';

export class ErrorBoundary {
  private _seen = new Set<string>();

  constructor(
    private _sdkKey: string,
    private _options: AnyStatsigOptions | null,
    private _emitter?: StatsigClientEmitEventFunc,
  ) {}

  wrap(instance: unknown): void {
    try {
      const obj = instance as Record<string, unknown>;

      _getAllInstanceMethodNames(obj).forEach((name) => {
        const original = obj[name] as (...args: unknown[]) => unknown;
        if ('$EB' in original) {
          return;
        }

        obj[name] = (...args: unknown[]) => {
          return this.capture(name, () => original.apply(instance, args));
        };
        (obj[name] as { $EB: boolean }).$EB = true;
      });
    } catch (err) {
      this._onError('eb:wrap', err);
    }
  }

  capture(tag: string, task: () => unknown): unknown {
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

  logError(tag: string, error: unknown): void {
    this._onError(tag, error);
  }

  private _onError(tag: string, error: unknown) {
    try {
      Log.warn(`Caught error in ${tag}`, { error });

      const impl = async () => {
        const unwrapped = (error ??
          Error('[Statsig] Error was empty')) as unknown;
        const isError = unwrapped instanceof Error;
        const name = isError ? unwrapped.name : 'No Name';

        if (this._seen.has(name)) {
          return;
        }

        this._seen.add(name);

        if (this._options?.networkConfig?.preventAllNetworkTraffic) {
          this._emitter?.({ name: 'error', error });
          return;
        }

        const sdkType = SDKType._get(this._sdkKey);
        const statsigMetadata = StatsigMetadataProvider.get();
        const info = isError ? unwrapped.stack : _getDescription(unwrapped);
        const body = JSON.stringify({
          tag,
          exception: name,
          info,
          ...{ ...statsigMetadata, sdkType },
        });

        await fetch(EXCEPTION_ENDPOINT, {
          method: 'POST',
          headers: {
            'STATSIG-API-KEY': this._sdkKey,
            'STATSIG-SDK-TYPE': String(sdkType),
            'STATSIG-SDK-VERSION': String(statsigMetadata.sdkVersion),
            'Content-Type': 'application/json',
          },
          body,
        });

        this._emitter?.({ name: 'error', error });
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

function _getDescription(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '[Statsig] Failed to get string for error.';
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
