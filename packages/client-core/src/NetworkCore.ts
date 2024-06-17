import './$_StatsigGlobal';
import { _getStatsigGlobalFlag } from './$_StatsigGlobal';
import { Diagnostics } from './Diagnostics';
import { Log } from './Log';
import { NetworkArgs, NetworkParam, NetworkPriority } from './NetworkConfig';
import { SDKType } from './SDKType';
import { _getWindowSafe } from './SafeJs';
import { SessionID } from './SessionID';
import { StableID } from './StableID';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { SDK_VERSION, StatsigMetadataProvider } from './StatsigMetadata';
import { AnyStatsigOptions, NetworkConfigCommon } from './StatsigOptionsCommon';
import { Flatten } from './TypingUtils';
import { _isUnloading } from './VisibilityObserving';

const DEFAULT_TIMEOUT_MS = 10_000;

type RequestArgs = {
  sdkKey: string;
  url: string;
  priority?: NetworkPriority;
  retries?: number;
  params?: Record<string, string>;
  headers?: /* Warn: Using headers leads to preflight requests */ Record<
    string,
    string
  >;
};

export type RequestArgsWithData = Flatten<
  RequestArgs & {
    data: Record<string, unknown>;
    isStatsigEncodable?: boolean;
    isCompressable?: boolean;
  }
>;

type BeaconRequestArgs = Pick<
  RequestArgsWithData,
  'data' | 'sdkKey' | 'url' | 'params' | 'isCompressable'
>;

type RequestArgsInternal = RequestArgs & {
  method: 'POST' | 'GET';
  body?: BodyInit;
};

type NetworkResponse = {
  body: string | null;
  code: number;
};

export class NetworkCore {
  private readonly _timeout: number = DEFAULT_TIMEOUT_MS;
  private readonly _netConfig: NetworkConfigCommon = {};
  private readonly _options: AnyStatsigOptions = {};

  constructor(
    options: AnyStatsigOptions | null,
    private _emitter?: StatsigClientEmitEventFunc,
  ) {
    if (options) {
      this._options = options;
    }

    if (this._options.networkConfig) {
      this._netConfig = this._options.networkConfig;
    }

    if (this._netConfig.networkTimeoutMs) {
      this._timeout = this._netConfig.networkTimeoutMs;
    }
  }

  async post(args: RequestArgsWithData): Promise<NetworkResponse | null> {
    let body: BodyInit = await this._getPopulatedBody(args);
    if (args.isStatsigEncodable) {
      body = this._attemptToEncodeString(args, body);
    }

    return this._sendRequest({
      method: 'POST',
      body,
      ...args,
    });
  }

  get(args: RequestArgs): Promise<NetworkResponse | null> {
    return this._sendRequest({ method: 'GET', ...args });
  }

  isBeaconSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    );
  }

  async beacon(args: BeaconRequestArgs): Promise<boolean> {
    if (!_ensureValidSdkKey(args)) {
      return false;
    }

    const body: BodyInit = await this._getPopulatedBody(args);
    const url = await this._getPopulatedURL(args);
    const nav = navigator;
    return nav.sendBeacon.bind(nav)(url, body);
  }

  private async _sendRequest(
    args: RequestArgsInternal,
  ): Promise<NetworkResponse | null> {
    if (!_ensureValidSdkKey(args)) {
      return null;
    }

    if (this._netConfig.preventAllNetworkTraffic) {
      return null;
    }

    const { method, body, retries } = args;

    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    const handle = setTimeout(
      () => controller?.abort(`Timeout of ${this._timeout}ms expired.`),
      this._timeout,
    );
    const url = await this._getPopulatedURL(args);

    let response: Response | null = null;
    const keepalive = _isUnloading();

    try {
      const config: NetworkArgs = {
        method,
        body,
        headers: {
          ...args.headers,
        },
        signal: controller?.signal,
        priority: args.priority,
        keepalive,
      };

      const func = this._netConfig.networkOverrideFunc ?? fetch;
      response = await func(url, config);
      clearTimeout(handle);

      if (!response.ok) {
        const text = await response.text().catch(() => 'No Text');
        const err = new Error(`NetworkError: ${url} ${text}`);
        err.name = 'NetworkError';
        throw err;
      }

      const text = await response.text();
      Diagnostics.mark();

      return {
        body: text,
        code: response.status,
      };
    } catch (error) {
      const errorMessage = _getErrorMessage(controller, error);
      Diagnostics.mark();

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
    const params: Record<string, string> = {
      [NetworkParam.SdkKey]: args.sdkKey,
      [NetworkParam.SdkType]: SDKType._get(args.sdkKey),
      [NetworkParam.SdkVersion]: SDK_VERSION,
      [NetworkParam.Time]: String(Date.now()),
      [NetworkParam.SessionID]: await SessionID.get(args.sdkKey),
      ...args.params,
    };

    const query = Object.keys(params)
      .map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
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

  private _attemptToEncodeString(
    args: RequestArgsWithData,
    input: string,
  ): string {
    const win = _getWindowSafe();
    if (
      !args.isStatsigEncodable ||
      this._options.disableStatsigEncoding ||
      _getStatsigGlobalFlag('no-encode') != null ||
      !win?.btoa
    ) {
      return input;
    }

    try {
      const result = win.btoa(input).split('').reverse().join('') ?? input;
      args.params = {
        ...(args.params ?? {}),
        [NetworkParam.StatsigEncoded]: '1',
      };
      return result;
    } catch {
      Log.warn('/initialize request encoding failed');
      return input;
    }
  }
}

const _ensureValidSdkKey = (args: RequestArgs) => {
  if (!args.sdkKey) {
    Log.warn('Unable to make request without an SDK key');
    return false;
  }
  return true;
};

function _getErrorMessage(
  controller: AbortController | null,
  error: unknown,
): string | null {
  if (
    controller?.signal.aborted &&
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

  return 'Unknown Error';
}
