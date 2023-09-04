import { StatsigEvent } from './StatsigEvent';
import { SDK_VERSION } from './StatsigMetadata';

export class StatsigNetworkCore {
  private _headers: Record<string, string>;

  constructor(
    sdkKey: string,
    sdkType: string,
    protected _api: string,
  ) {
    this._headers = {
      'Content-Type': 'application/json',
      'STATSIG-API-KEY': sdkKey,
      'STATSIG-SDK-TYPE': sdkType,
      'STATSIG-SDK-VERSION': SDK_VERSION,
    };
  }

  async sendEvents(events: StatsigEvent[]) {
    return this._sendPostRequest(`${this._api}/rgstr`, {
      events,
    });
  }

  protected async _sendPostRequest<T>(
    url: string,
    body: Record<string, unknown>,
    timeout = 10_000,
  ): Promise<T> {
    const controller = new AbortController();
    const handle = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: this._headers,
      signal: controller.signal,
    });
    clearTimeout(handle);

    const text = await response.text();
    return JSON.parse(text) as T;
  }
}
