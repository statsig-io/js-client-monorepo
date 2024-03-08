import { Diagnostics } from './Diagnostics';
import { Log } from './Log';
import { SessionID } from './SessionID';
import { StableID } from './StableID';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';

const DEFAULT_TIMEOUT_MS = 10_000;

type RequestArgs = {
  sdkKey: string;
  url: string;
  timeoutMs?: number;
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

class NetworkError extends Error {
  constructor(
    message: string,
    public errorDescription: string,
  ) {
    super(message);
  }
}

export class NetworkCore {
  private readonly _timeout: number;

  constructor(
    private _options: StatsigOptionsCommon | null,
    private _emitter?: StatsigClientEmitEventFunc,
  ) {
    this._timeout = _options?.networkTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async post(args: RequestArgsWithData): Promise<NetworkResponse | null> {
    const { data } = args;
    const stableID = await StableID.get(args.sdkKey);
    const sessionID = SessionID.get(args.sdkKey);
    const body = JSON.stringify({
      ...data,
      statsigMetadata: {
        ...StatsigMetadataProvider.get(),
        stableID,
        sessionID,
      },
    });

    return this._sendRequest({ method: 'POST', body, ...args });
  }

  async get(args: RequestArgs): Promise<NetworkResponse | null> {
    return this._sendRequest({ method: 'GET', ...args });
  }

  beacon(args: RequestArgsWithData): boolean {
    const url = new URL(args.url);
    url.searchParams.append('k', args.sdkKey);
    return navigator.sendBeacon(url, JSON.stringify(args.data));
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

    let response: Response | null = null;
    try {
      const fullUrl = this._getPopulatedURL(args);
      response = await fetch(fullUrl, {
        method,
        body,
        headers: {
          ...args.headers,
        },
        signal: controller.signal,
      });
      clearTimeout(handle);

      const text = await response.text();
      if (!response.ok) {
        throw new NetworkError('Fetch Failure', text);
      }

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
        this._emitter?.({ event: 'error', error });
        Log.error('A networking error occured.', errorMessage);
        return null;
      }

      return this._sendRequest({ ...args, retries: retries - 1 });
    }
  }

  private _getPopulatedURL(args: RequestArgs): string {
    const metadata = StatsigMetadataProvider.get();
    const url = new URL(args.url);

    url.searchParams.append('k', args.sdkKey);
    url.searchParams.append('st', metadata.sdkType);
    url.searchParams.append('sv', metadata.sdkVersion);
    url.searchParams.append('t', String(Date.now()));
    url.searchParams.append('sid', SessionID.get(args.sdkKey));

    if (args.params) {
      Object.entries(args.params).forEach(([k, v]) => {
        url.searchParams.append(k, v);
      });
    }

    return url.toString();
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
