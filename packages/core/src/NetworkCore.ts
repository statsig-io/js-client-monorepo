import { getUUID } from './IDUtil';
import { StatsigEvent } from './StatsigEvent';
import { SDK_VERSION } from './StatsigMetadata';

export class NetworkCore {
  private readonly _headers: Record<string, string>;
  private readonly _statsigMetadata: Record<string, string>;

  constructor(
    sdkKey: string,
    sdkType: string,
    stableID: string,
    protected readonly _api: string,
  ) {
    this._headers = {
      'Content-Type': 'application/json',
      'STATSIG-API-KEY': sdkKey,
      'STATSIG-SDK-TYPE': sdkType,
      'STATSIG-SDK-VERSION': SDK_VERSION,
    };

    this._statsigMetadata = {
      stableID,
      sdkType,
      sdkVersion: SDK_VERSION,
      sessionID: getUUID(),
    };
  }

  async sendEvents(events: StatsigEvent[]) {
    return this._sendPostRequest(`${this._api}/rgstr`, {
      events,
    });
  }

  protected async _sendPostRequest<T>(
    url: string,
    data: Record<string, unknown>,
    timeout = 10_000,
  ): Promise<T> {
    const controller = new AbortController();
    const handle = setTimeout(() => controller.abort(), timeout);
    const body = JSON.stringify({
      ...data,
      statsigMetadata: this._statsigMetadata,
    });

    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: this._headers,
      signal: controller.signal,
    });
    clearTimeout(handle);

    const text = await response.text();
    return JSON.parse(text) as T;
  }
}
