import './$_StatsigGlobal';
import { _getStatsigGlobalFlag } from './$_StatsigGlobal';
import { Diagnostics } from './Diagnostics';
import { ErrorBoundary } from './ErrorBoundary';
import { Log } from './Log';
import { NetworkArgs, NetworkParam, NetworkPriority } from './NetworkConfig';
import {
  FallbackResolverArgs,
  NetworkFallbackResolver,
} from './NetworkFallbackResolver';
import { SDKType } from './SDKType';
import { _getWindowSafe } from './SafeJs';
import { SessionID } from './SessionID';
import { StableID } from './StableID';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { ErrorTag } from './StatsigClientEventEmitter';
import { SDK_VERSION, StatsigMetadataProvider } from './StatsigMetadata';
import { AnyStatsigOptions, NetworkConfigCommon } from './StatsigOptionsCommon';
import { Flatten } from './TypingUtils';
import { _isUnloading } from './VisibilityObserving';

const DEFAULT_TIMEOUT_MS = 10_000;

const RETRYABLE_CODES = new Set([408, 500, 502, 503, 504, 522, 524, 599]);

type RequestArgs = {
  sdkKey: string;
  url: string;
  priority?: NetworkPriority;
  retries?: number;
  attempt?: number;
  isInitialize?: boolean;
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
  'data' | 'sdkKey' | 'url' | 'params' | 'isCompressable' | 'attempt'
>;

type RequestArgsInternal = Flatten<
  RequestArgs &
    FallbackResolverArgs & {
      method: 'POST' | 'GET';
      body?: BodyInit;
    }
>;

type NetworkResponse = {
  body: string | null;
  code: number;
};

export class NetworkCore {
  private readonly _timeout: number = DEFAULT_TIMEOUT_MS;
  private readonly _netConfig: NetworkConfigCommon = {};
  private readonly _options: AnyStatsigOptions = {};
  private readonly _fallbackResolver: NetworkFallbackResolver;

  private _errorBoundary: ErrorBoundary | null = null;

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
    this._fallbackResolver = new NetworkFallbackResolver(this._options);
  }

  setErrorBoundary(errorBoundary: ErrorBoundary): void {
    this._errorBoundary = errorBoundary;
    this._errorBoundary.wrap(this);
    this._errorBoundary.wrap(this._fallbackResolver);
    this._fallbackResolver.setErrorBoundary(errorBoundary);
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

    const argsInternal = this._getInternalRequestArgs('POST', args);
    const body: BodyInit = await this._getPopulatedBody(
      argsInternal,
      args.data,
    );
    const url = await this._getPopulatedURL(argsInternal);
    const nav = navigator;
    return nav.sendBeacon.bind(nav)(url, body);
  }

  async post(args: RequestArgsWithData): Promise<NetworkResponse | null> {
    const argsInternal = this._getInternalRequestArgs('POST', args);

    argsInternal.body = await this._getPopulatedBody(argsInternal, args.data);
    if (args.isStatsigEncodable) {
      argsInternal.body = this._attemptToEncodeString(
        argsInternal,
        argsInternal.body,
      );
    }

    return this._sendRequest(argsInternal);
  }

  get(args: RequestArgs): Promise<NetworkResponse | null> {
    const argsInternal = this._getInternalRequestArgs('GET', args);
    return this._sendRequest(argsInternal);
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

    const { method, body, retries, attempt } = args;
    const currentAttempt = attempt ?? 1;

    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : null;

    const timeoutHandle = setTimeout(() => {
      abortController?.abort(`Timeout of ${this._timeout}ms expired.`);
    }, this._timeout);

    const populatedUrl = await this._getPopulatedURL(args);

    let response: Response | null = null;
    const keepalive = _isUnloading();

    try {
      const config: NetworkArgs = {
        method,
        body,
        headers: {
          ...args.headers,
        },
        signal: abortController?.signal,
        priority: args.priority,
        keepalive,
      };

      _tryMarkInitStart(args, currentAttempt);

      const func = this._netConfig.networkOverrideFunc ?? fetch;
      response = await func(populatedUrl, config);
      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const text = await response.text().catch(() => 'No Text');
        const err = new Error(`NetworkError: ${populatedUrl} ${text}`);
        err.name = 'NetworkError';
        throw err;
      }

      const text = await response.text();

      _tryMarkInitEnd(args, response, currentAttempt, text);
      this._fallbackResolver.tryBumpExpiryTime(args.sdkKey, populatedUrl);

      return {
        body: text,
        code: response.status,
      };
    } catch (error) {
      const errorMessage = _getErrorMessage(abortController, error);
      const timedOut = _didTimeout(abortController);

      _tryMarkInitEnd(args, response, currentAttempt, '', error);

      const fallbackUpdated =
        await this._fallbackResolver.tryFetchUpdatedFallbackInfo(
          args.sdkKey,
          populatedUrl,
          errorMessage,
          timedOut,
        );

      if (fallbackUpdated) {
        args.fallbackUrl = this._fallbackResolver.getFallbackUrl(
          args.sdkKey,
          args.url,
        );
      }

      if (
        !retries ||
        currentAttempt > retries ||
        !RETRYABLE_CODES.has(response?.status ?? 500)
      ) {
        this._emitter?.({
          name: 'error',
          error,
          tag: ErrorTag.NetworkError,
          requestArgs: args,
        });
        Log.error(
          `A networking error occured during ${method} request to ${populatedUrl}.`,
          errorMessage,
          error,
        );
        return null;
      }

      return this._sendRequest({
        ...args,
        retries,
        attempt: currentAttempt + 1,
      });
    }
  }

  private async _getPopulatedURL(args: RequestArgsInternal): Promise<string> {
    const url = args.fallbackUrl ?? args.url;

    const params: Record<string, string> = {
      [NetworkParam.SdkKey]: args.sdkKey,
      [NetworkParam.SdkType]: SDKType._get(args.sdkKey),
      [NetworkParam.SdkVersion]: SDK_VERSION,
      [NetworkParam.Time]: String(Date.now()),
      [NetworkParam.SessionID]: SessionID.get(args.sdkKey),
      ...args.params,
    };

    const query = Object.keys(params)
      .map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
      })
      .join('&');

    return `${url}${query ? `?${query}` : ''}`;
  }

  private async _getPopulatedBody(
    args: RequestArgsInternal,
    data: Record<string, unknown>,
  ): Promise<string> {
    const { sdkKey, fallbackUrl } = args;
    const stableID = StableID.get(sdkKey);
    const sessionID = SessionID.get(sdkKey);
    const sdkType = SDKType._get(sdkKey);

    return JSON.stringify({
      ...data,
      statsigMetadata: {
        ...StatsigMetadataProvider.get(),
        stableID,
        sessionID,
        sdkType,
        fallbackUrl,
      },
    });
  }

  private _attemptToEncodeString(
    args: RequestArgsInternal,
    input: string,
  ): string {
    const win = _getWindowSafe();
    if (
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

  private _getInternalRequestArgs(
    method: 'GET' | 'POST',
    args: RequestArgs,
  ): RequestArgsInternal {
    const fallbackUrl = this._fallbackResolver.getFallbackUrl(
      args.sdkKey,
      args.url,
    );

    return {
      ...args,
      method,
      fallbackUrl,
    };
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

function _didTimeout(controller: AbortController | null): boolean {
  const timeout =
    controller?.signal.aborted &&
    typeof controller.signal.reason === 'string' &&
    controller.signal.reason.includes('Timeout');

  return timeout || false;
}

function _tryMarkInitStart(args: RequestArgsInternal, attempt: number) {
  if (!args.isInitialize) {
    return;
  }

  Diagnostics._markInitNetworkReqStart(args.sdkKey, {
    attempt,
  });
}

function _tryMarkInitEnd(
  args: RequestArgsInternal,
  response: Response | null,
  attempt: number,
  body: string,
  err?: unknown,
) {
  if (!args.isInitialize) {
    return;
  }

  Diagnostics._markInitNetworkReqEnd(
    args.sdkKey,
    Diagnostics._getDiagnosticsData(response, attempt, body, err),
  );
}
