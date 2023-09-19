export const EXCEPTION_ENDPOINT = 'https://statsigapi.net/v1/sdk_exception';

type Config = {
  sdkKey: string;
  metadata: Record<string, unknown>;
  isSilent?: boolean;
};

let _seen = new Set<string>();
let _config: Config | null = null;

export function configureErrorBoundary(config: Config) {
  _config = config;
}

export function errorBoundary(tag: string, task: () => unknown) {
  try {
    const res = task();
    if (res && res instanceof Promise) {
      return res.catch((err) => _onError(tag, err));
    }
    return res;
  } catch (error) {
    _onError(tag, error);
  }
}

function _onError(tag: string, error: unknown) {
  try {
    if (_config?.isSilent !== true) {
      console.warn(`[Statsig]: Caught Error in ${tag}`, error);
    }

    const impl = async () => {
      const unwrapped = (error ?? Error('[Statsig] Error was empty')) as any;
      const isError = unwrapped instanceof Error;
      const name = isError ? unwrapped.name : 'No Name';

      if (_seen.has(name) || !_config?.sdkKey) {
        return;
      }
      _seen.add(name);

      const info = isError ? unwrapped.stack : _getDescription(unwrapped);
      const body = JSON.stringify({
        tag,
        exception: name,
        info,
        ..._config.metadata,
      });

      return fetch(EXCEPTION_ENDPOINT, {
        method: 'POST',
        headers: {
          'STATSIG-API-KEY': _config.sdkKey,
          'STATSIG-SDK-TYPE': String(_config.metadata?.['sdkType']),
          'STATSIG-SDK-VERSION': String(_config.metadata?.['sdkVersion']),
          'Content-Type': 'application/json',
          'Content-Length': `${body.length}`,
        },
        body,
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

function _getDescription(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '[Statsig] Failed to get string for error.';
  }
}
