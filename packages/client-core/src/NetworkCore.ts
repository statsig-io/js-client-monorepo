import { Diagnostics } from './Diagnostics';
import { Log } from './Log';
import { StableID } from './StableID';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { getUUID } from './UUID';

const DEFAULT_TIMEOUT_MS = 10_000;

type RequestArgs = {
  sdkKey: string;
  url: string;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
};

type RequestArgsWithData = RequestArgs & {
  data: Record<string, unknown>;
};

type RequestArgsInternal = RequestArgs & {
  method: 'POST' | 'GET';
  body?: string;
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
  private readonly _sessionID: string;
  private readonly _timeout: number;

  constructor(private _options: StatsigOptionsCommon | null) {
    this._timeout = _options?.networkTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this._sessionID = getUUID();
  }

  async post(args: RequestArgsWithData): Promise<string | null> {
    const { data } = args;
    const stableID = await StableID.get(args.sdkKey);
    const body = JSON.stringify({
      ...data,
      statsigMetadata: {
        ...StatsigMetadataProvider.get(),
        stableID,
        sessionID: this._sessionID,
      },
    });

    return this._sendRequest({ method: 'POST', body, ...args });
  }

  async get(args: RequestArgs): Promise<string | null> {
    return this._sendRequest({ method: 'GET', ...args });
  }

  beacon(args: RequestArgsWithData): boolean {
    const url = new URL(args.url);
    url.searchParams.append('k', args.sdkKey);
    return navigator.sendBeacon(url, JSON.stringify(args.data));
  }

  private async _sendRequest(
    args: RequestArgsInternal,
  ): Promise<string | null> {
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
          // Must set this content type to bypass cors
          // can override via headers if necessary (recommended for logevent)
          'Content-Type': 'text/plain',
          ...args.headers
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

      return text;
    } catch (error) {
      const errorMessage = _getErrorMessage(controller, error);
      Diagnostics.mark('_sendRequest:error', {
        error: errorMessage,
        status: response?.status,
        contentLength: response?.headers.get('content-length'),
      });

      if (!retries || retries <= 0) {
        Log.error('A networking error occured.', errorMessage);
        return null;
      }

      return this._sendRequest({ ...args, retries: retries - 1 });
    }
  }

  private _getPopulatedURL(args: RequestArgs): string {
    const statsigMetadata = StatsigMetadataProvider.get();
    const fullUrl = new URL(args.url);
    fullUrl.searchParams.append('k', args.sdkKey);
    fullUrl.searchParams.append('st', statsigMetadata.sdkType);
    fullUrl.searchParams.append('sv', statsigMetadata.sdkVersion);
    fullUrl.searchParams.append('t', String(Date.now()));
    fullUrl.searchParams.append('sid', this._sessionID);

    return fullUrl.toString();
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
