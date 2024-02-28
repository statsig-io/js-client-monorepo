import { Diagnostics } from './Diagnostics';
import { Log } from './Log';
import { monitorFunction } from './Monitoring';
import { StableID } from './StableID';
import { StatsigMetadataProvider } from './StatsigMetadata';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { getUUID } from './UUID';

const DEFAULT_TIMEOUT_MS = 10_000;

type CommonArgs = {
  sdkKey: string;
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
  private readonly _timeout: number;

  constructor(private _options: StatsigOptionsCommon | null) {
    this._timeout = _options?.networkTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this._sessionID = getUUID();
  }

  async post(args: PostRequestArgs): Promise<string | null> {
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

  async get(args: CommonArgs): Promise<string | null> {
    return this._sendRequest({ method: 'GET', ...args });
  }

  protected async _sendRequest(args: RequestArgs): Promise<string | null> {
    return monitorFunction(
      '_sendRequest',
      () => this._sendRequestImpl(args),
      this,
    );
  }

  private async _sendRequestImpl(args: RequestArgs): Promise<string | null> {
    const { method, url, body, retries } = args;

    const controller = new AbortController();
    const handle = setTimeout(
      () => controller.abort(`Timeout of ${this._timeout}ms expired.`),
      this._timeout,
    );

    let response: Response | null = null;
    try {
      response = await fetch(url, {
        method,
        body,
        headers: this._getPopulatedHeaders(args),
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

  private _getPopulatedHeaders(args: RequestArgs) {
    const statsigMetadata = StatsigMetadataProvider.get();
    return {
      ...args.headers,
      'Content-Type': 'application/json',
      'STATSIG-API-KEY': args.sdkKey,
      'STATSIG-SDK-TYPE': statsigMetadata.sdkType,
      'STATSIG-SDK-VERSION': statsigMetadata.sdkVersion,
      'STATSIG-CLIENT-TIME': String(Date.now()),
      'STATSIG-SESSION-ID': this._sessionID,
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
