import { Log } from './Log';
import { SDKType } from './SDKType';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigMetadataProvider } from './StatsigMetadata';

export const EXCEPTION_ENDPOINT = 'https://statsigapi.net/v1/sdk_exception';

export class ErrorBoundary {
  private _seen = new Set<string>();

  constructor(private _sdkKey: string) {}

  capture(
    tag: string,
    task: () => unknown,
    emitter?: StatsigClientEmitEventFunc,
  ): unknown {
    try {
      const res = task();
      if (res && res instanceof Promise) {
        return res.catch((err) => this._onError(tag, err, emitter));
      }
      return res;
    } catch (error) {
      this._onError(tag, error, emitter);
      return null;
    }
  }

  logError(tag: string, error: unknown): void {
    this._onError(tag, error);
  }

  private _onError(
    tag: string,
    error: unknown,
    emitter?: StatsigClientEmitEventFunc,
  ) {
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

        emitter?.({ name: 'error', error });
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
