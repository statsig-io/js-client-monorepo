import { StableID } from './StableID';
import { StatsigEvent } from './StatsigEvent';
import { StatsigMetadata } from './StatsigMetadata';
import { getUUID } from './UUID';

type StatsigNetworkResponse = {
  success: boolean;
};

export class NetworkCore {
  private readonly _sessionID: string;

  constructor(
    protected readonly _sdkKey: string,
    protected readonly _api: string,
  ) {
    this._sessionID = getUUID();
  }

  async sendEvents(events: StatsigEvent[]): Promise<StatsigNetworkResponse> {
    return this._sendPostRequest(`${this._api}/rgstr`, {
      events,
    });
  }

  protected async _sendPostRequest<T>(
    url: string,
    data: Record<string, unknown>,
    timeoutMs = 10_000,
  ): Promise<T> {
    const controller = new AbortController();
    const handle = setTimeout(() => controller.abort(), timeoutMs);
    const statsigMetadata = StatsigMetadata.get();
    const stableID = await StableID.get();
    const body = JSON.stringify({
      ...data,
      statsigMetadata: {
        ...statsigMetadata,
        stableID,
        sessionID: this._sessionID,
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'STATSIG-API-KEY': this._sdkKey,
        'STATSIG-SDK-TYPE': statsigMetadata.sdkType,
        'STATSIG-SDK-VERSION': statsigMetadata.sdkVersion,
      },
      signal: controller.signal,
    });
    clearTimeout(handle);

    const text = await response.text();
    return JSON.parse(text) as T;
  }
}
