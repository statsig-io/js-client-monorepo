import { Log } from './Log';
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

  constructor(
    protected readonly _sdkKey: string,
    protected readonly _api: string,
  ) {
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

  protected async _sendRequest<T>(args: RequestArgs): Promise<T | null> {
    const { method, url, headers, body, retries } = args;

    const controller = new AbortController();
    const handle = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
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

      return JSON.parse(text) as T;
    } catch (error) {
      if (!retries || retries <= 0) {
        Log.error('A networking error occured.', error);
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
