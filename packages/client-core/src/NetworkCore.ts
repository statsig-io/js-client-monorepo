import { Diagnostics } from './Diagnostics';
import { Log } from './Log';
import { SDKType } from './SDKType';
import { SessionID } from './SessionID';
import { StableID } from './StableID';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { SDK_VERSION, StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';

const DEFAULT_TIMEOUT_MS = 10_000;

type RequestArgs = {
  sdkKey: string;
  url: string;
  retries?: number;
  params?: Record<string, string>;
  headers?: /* Warn: Using headers leads to preflight requests */ Record<
    string,
    string
  >;
};

type RequestArgsWithData = RequestArgs & {
  data: Record<string, unknown>;
};

type RequestArgsInternal = RequestArgs & {
  method: 'POST' | 'GET';
  body?: string;
};

type NetworkResponse = {
  body: string | null;
  code: number;
};

export class NetworkCore {
  private readonly _timeout: number;

  constructor(
    private _options: StatsigOptionsCommon | null,
    private _emitter?: StatsigClientEmitEventFunc,
  ) {
    this._timeout = _options?.networkTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async post(args: RequestArgsWithData): Promise<NetworkResponse | null> {
    const body = await this._getPopulatedBody(args);
    return this._sendRequest({ method: 'POST', body, ...args });
  }

  get(args: RequestArgs): Promise<NetworkResponse | null> {
    return this._sendRequest({ method: 'GET', ...args });
  }

  isBeaconSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator?.sendBeacon === 'function'
    );
  }

  async beacon(args: RequestArgsWithData): Promise<boolean> {
    const url = await this._getPopulatedURL(args);
    const body = await this._getPopulatedBody(args);
    return navigator.sendBeacon(url, body);
  }

  private async _sendRequest(
    args: RequestArgsInternal,
  ): Promise<NetworkResponse | null> {
    const { method, body, retries } = args;

    const controller = new AbortController();
    const handle = setTimeout(
      () => controller.abort(`Timeout of ${this._timeout}ms expired.`),
      this._timeout,
    );
    const url = await this._getPopulatedURL(args);

    let response: Response | null = null;
    try {
      response = await fetch(url, {
        method,
        body,
        headers: {
          ...args.headers,
        },
        signal: controller.signal,
      });
      clearTimeout(handle);

      if (!response.ok) {
        const text = await response.text().catch(() => 'No Text');
        const err = new Error(`Failed to fetch: ${url} ${text}`);
        err.name = 'NetworkError';
        throw err;
      }

      const text = await response.text();
      Diagnostics.mark('_sendRequest:response-received', {
        status: response.status,
        contentLength: response.headers.get('content-length'),
      });

      return {
        body: text,
        code: response.status,
      };
    } catch (error) {
      const errorMessage = _getErrorMessage(controller, error);
      Diagnostics.mark('_sendRequest:error', {
        error: errorMessage,
        status: response?.status,
        contentLength: response?.headers.get('content-length'),
      });

      if (!retries || retries <= 0) {
        this._emitter?.({ name: 'error', error });
        Log.error(
          `A networking error occured during ${method} request to ${url}.`,
          errorMessage,
          error,
        );
        return null;
      }

      return this._sendRequest({ ...args, retries: retries - 1 });
    }
  }

  private async _getPopulatedURL(args: RequestArgs): Promise<string> {
    const params = {
      k: args.sdkKey,
      st: SDKType._get(args.sdkKey),
      sv: SDK_VERSION,
      t: String(Date.now()),
      sid: await SessionID.get(args.sdkKey),
      ...args.params,
    };

    const query = Object.entries(params)
      .map(([key, value]) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');

    return `${args.url}${query ? `?${query}` : ''}`;
  }

  private async _getPopulatedBody(args: RequestArgsWithData): Promise<string> {
    const { data, sdkKey } = args;
    const stableID = await StableID.get(sdkKey);
    const sessionID = await SessionID.get(sdkKey);
    const sdkType = SDKType._get(sdkKey);

    return JSON.stringify({
      ...data,
      statsigMetadata: {
        ...StatsigMetadataProvider.get(),
        stableID,
        sessionID,
        sdkType,
      },
    });
  }
}

function _getErrorMessage(
  controller: AbortController,
  error: unknown,
): string | null {
  if (
    controller.signal.aborted &&
    typeof controller.signal.reason === 'string'
  ) {
    return controller.signal.reason;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return null;
}
