import { Diagnostics } from './Diagnostics';
import { Log } from './Log';
import { MonitoredFunction } from './Monitoring';
import { StableID } from './StableID';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { getUUID } from './UUID';

const DEFAULT_TIMEOUT = 10_000;

type CommonArgs = {
  url: string;
  timeoutMs?: number;
  retries?: number;
};

type PostRequestArgs = CommonArgs & {
  data: Record<string, unknown>;
};

type RequestArgs = CommonArgs & {
  method: 'POST' | 'GET';
  body?: string;
  headers?: Record<string, string>;
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

  constructor(protected readonly _sdkKey: string) {
    this._sessionID = getUUID();
  }

  async post<T>(args: PostRequestArgs): Promise<T | null> {
    const { data } = args;
    const stableID = await StableID.get();
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

  async get<T>(args: CommonArgs): Promise<T | null> {
    return this._sendRequest({ method: 'GET', ...args });
  }

  @MonitoredFunction()
  protected async _sendRequest<T>(args: RequestArgs): Promise<T | null> {
    const { method, url, headers, body, retries } = args;

    const controller = new AbortController();
    const handle = setTimeout(
      () => controller.abort(`Timeout of ${DEFAULT_TIMEOUT}ms expired.`),
      100,
    );

    let response: Response | null = null;
    try {
      response = await fetch(url, {
        method,
        body,
        headers: this._getPopulatedHeaders(headers),
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

      return JSON.parse(text) as T;
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

  private _getPopulatedHeaders(additions?: Record<string, string>) {
    const statsigMetadata = StatsigMetadataProvider.get();
    return {
      ...additions,
      'Content-Type': 'application/json',
      'STATSIG-API-KEY': this._sdkKey,
      'STATSIG-SDK-TYPE': statsigMetadata.sdkType,
      'STATSIG-SDK-VERSION': statsigMetadata.sdkVersion,
      'STATSIG-CLIENT-TIME': String(Date.now()),
    };
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
