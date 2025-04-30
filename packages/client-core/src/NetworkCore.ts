import './$_StatsigGlobal';
import { _getStatsigGlobalFlag } from './$_StatsigGlobal';
import { Diagnostics } from './Diagnostics';
import { ErrorBoundary } from './ErrorBoundary';
import { Log } from './Log';
import {
  Endpoint,
  NetworkArgs,
  NetworkParam,
  NetworkPriority,
} from './NetworkConfig';
import {
  FallbackResolverArgs,
  NetworkFallbackResolver,
} from './NetworkFallbackResolver';
import { SDKFlags } from './SDKFlags';
import { SDKType } from './SDKType';
import { _getWindowSafe } from './SafeJs';
import { SessionID } from './SessionID';
import { StableID } from './StableID';
import { StatsigClientEmitEventFunc } from './StatsigClientBase';
import { ErrorTag } from './StatsigClientEventEmitter';
import { SDK_VERSION, StatsigMetadataProvider } from './StatsigMetadata';
import {
  AnyStatsigOptions,
  LogEventCompressionMode,
  NetworkConfigCommon,
} from './StatsigOptionsCommon';
import { Flatten } from './TypingUtils';
import { UrlConfiguration } from './UrlConfiguration';
import { _isUnloading } from './VisibilityObserving';

const DEFAULT_TIMEOUT_MS = 10_000;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_REQ_COUNT = 50;
const LEAK_RATE = RATE_LIMIT_MAX_REQ_COUNT / RATE_LIMIT_WINDOW_MS;

const RETRYABLE_CODES = new Set([408, 500, 502, 503, 504, 522, 524, 599]);

type RequestArgs = {
  sdkKey: string;
  urlConfig: UrlConfiguration;
  priority?: NetworkPriority;
  retries?: number;
  attempt?: number;
  params?: Record<string, string>;
  headers?: /* Warn: Using headers leads to preflight requests */ Record<
    string,
    string
  >;
  credentials?: RequestCredentials;
};

type DataFlags = {
  isStatsigEncodable?: boolean;
  isCompressable?: boolean;
};

export type RequestArgsWithData = Flatten<
  RequestArgs & {
    data: Record<string, unknown>;
  } & DataFlags
>;

type BeaconRequestArgs = Pick<
  RequestArgsWithData,
  'data' | 'sdkKey' | 'urlConfig' | 'params' | 'isCompressable' | 'attempt'
>;

type RequestArgsInternal = Flatten<
  RequestArgs &
    FallbackResolverArgs & {
      method: 'POST' | 'GET';
      body?: BodyInit;
    } & DataFlags
>;

type NetworkResponse = {
  body: string | null;
  code: number;
};

type LeakyBucketEntry = {
  count: number;
  lastRequestTime: number;
};

export class NetworkCore {
  protected _errorBoundary: ErrorBoundary | null = null;

  private readonly _timeout: number = DEFAULT_TIMEOUT_MS;
  private readonly _netConfig: NetworkConfigCommon = {};
  private readonly _options: AnyStatsigOptions = {};
  private readonly _fallbackResolver: NetworkFallbackResolver;

  private _leakyBucket: Record<string, LeakyBucketEntry> = {};
  private _lastUsedInitUrl: string | null = null;

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

    this.setLogEventCompressionMode(this._getLogEventCompressionMode(options));
  }

  setLogEventCompressionMode(mode: LogEventCompressionMode): void {
    this._options.logEventCompressionMode = mode;
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

  getLastUsedInitUrlAndReset(): string | null {
    const tempUrl = this._lastUsedInitUrl;
    this._lastUsedInitUrl = null;
    return tempUrl;
  }

  async beacon(args: BeaconRequestArgs): Promise<boolean> {
    if (!_ensureValidSdkKey(args)) {
      return false;
    }

    const argsInternal = this._getInternalRequestArgs('POST', args);
    await this._tryToCompressBody(argsInternal);

    const url = await this._getPopulatedURL(argsInternal);
    const nav = navigator;
    return nav.sendBeacon.bind(nav)(url, argsInternal.body);
  }

  async post(args: RequestArgsWithData): Promise<NetworkResponse | null> {
    const argsInternal = this._getInternalRequestArgs('POST', args);

    this._tryEncodeBody(argsInternal);
    await this._tryToCompressBody(argsInternal);

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
    const endpoint = args.urlConfig.endpoint;

    if (this._isRateLimited(endpoint)) {
      Log.warn(
        `Request to ${endpoint} was blocked because you are making requests too frequently.`,
      );
      return null;
    }

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

      const bucket = this._leakyBucket[endpoint];
      if (bucket) {
        bucket.lastRequestTime = Date.now();
        this._leakyBucket[endpoint] = bucket;
      }

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
      this._fallbackResolver.tryBumpExpiryTime(args.sdkKey, args.urlConfig);

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
          args.urlConfig,
          errorMessage,
          timedOut,
        );

      if (fallbackUpdated) {
        args.fallbackUrl = this._fallbackResolver.getActiveFallbackUrl(
          args.sdkKey,
          args.urlConfig,
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
        const formattedErrorMsg = `A networking error occurred during ${method} request to ${populatedUrl}.`;
        Log.error(formattedErrorMsg, errorMessage, error);
        this._errorBoundary?.attachErrorIfNoneExists(formattedErrorMsg);
        return null;
      }

      await _exponentialBackoff(currentAttempt);

      return this._sendRequest({
        ...args,
        retries,
        attempt: currentAttempt + 1,
      });
    }
  }

  private _getLogEventCompressionMode(
    options: AnyStatsigOptions | null,
  ): LogEventCompressionMode {
    // Handle backward compatibility for deprecated disableCompression flag
    let compressionMode = options?.logEventCompressionMode;
    if (!compressionMode && options?.disableCompression === true) {
      compressionMode = LogEventCompressionMode.Disabled;
    }

    // Default to enabled if unset
    if (!compressionMode) {
      compressionMode = LogEventCompressionMode.Enabled;
    }

    return compressionMode;
  }

  private _isRateLimited(endpoint: string): boolean {
    const now = Date.now();
    const bucket = this._leakyBucket[endpoint] ?? {
      count: 0,
      lastRequestTime: now,
    };

    const elapsed = now - bucket.lastRequestTime;
    const leakedRequests = Math.floor(elapsed * LEAK_RATE);
    bucket.count = Math.max(0, bucket.count - leakedRequests);

    if (bucket.count >= RATE_LIMIT_MAX_REQ_COUNT) {
      return true;
    }

    bucket.count += 1;
    bucket.lastRequestTime = now;
    this._leakyBucket[endpoint] = bucket;
    return false;
  }

  private async _getPopulatedURL(args: RequestArgsInternal): Promise<string> {
    const url = args.fallbackUrl ?? args.urlConfig.getUrl();

    if (
      args.urlConfig.endpoint === Endpoint._initialize ||
      args.urlConfig.endpoint === Endpoint._download_config_specs
    ) {
      this._lastUsedInitUrl = url;
    }

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

  private _tryEncodeBody(args: RequestArgsInternal): void {
    const win = _getWindowSafe();
    const body = args.body;
    if (
      !args.isStatsigEncodable ||
      this._options.disableStatsigEncoding ||
      typeof body !== 'string' ||
      _getStatsigGlobalFlag('no-encode') != null ||
      !win?.btoa
    ) {
      return;
    }

    try {
      args.body = win.btoa(body).split('').reverse().join('');
      args.params = {
        ...(args.params ?? {}),
        [NetworkParam.StatsigEncoded]: '1',
      };
    } catch (e) {
      Log.warn(`Request encoding failed for ${args.urlConfig.getUrl()}`, e);
    }
  }

  private async _tryToCompressBody(args: RequestArgsInternal): Promise<void> {
    const body = args.body;
    if (typeof body !== 'string' || !_allowCompression(args, this._options)) {
      return;
    }

    try {
      const bytes = new TextEncoder().encode(body);
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();

      writer.write(bytes).catch(Log.error);
      writer.close().catch(Log.error);

      const reader = stream.readable.getReader();
      const chunks: Uint8Array[] = [];

      let result: ReadableStreamReadResult<Uint8Array>;
      // eslint-disable-next-line no-await-in-loop
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      args.body = combined;
      args.params = {
        ...(args.params ?? {}),
        [NetworkParam.IsGzipped]: '1',
      };
    } catch (e) {
      Log.warn(`Request compression failed for ${args.urlConfig.getUrl()}`, e);
    }
  }

  private _getInternalRequestArgs(
    method: 'GET' | 'POST',
    args: RequestArgs | RequestArgsWithData,
  ): RequestArgsInternal {
    const fallbackUrl = this._fallbackResolver.getActiveFallbackUrl(
      args.sdkKey,
      args.urlConfig,
    );

    const result = {
      ...args,
      method,
      fallbackUrl,
    };

    if ('data' in args) {
      _populateRequestBody(result, args.data);
    }

    return result;
  }
}

const _ensureValidSdkKey = (args: RequestArgs) => {
  if (!args.sdkKey) {
    Log.warn('Unable to make request without an SDK key');
    return false;
  }
  return true;
};

const _populateRequestBody = (
  args: RequestArgsInternal,
  data: Record<string, unknown>,
) => {
  const { sdkKey, fallbackUrl } = args;
  const stableID = StableID.get(sdkKey);
  const sessionID = SessionID.get(sdkKey);
  const sdkType = SDKType._get(sdkKey);

  args.body = JSON.stringify({
    ...data,
    statsigMetadata: {
      ...StatsigMetadataProvider.get(),
      stableID,
      sessionID,
      sdkType,
      fallbackUrl,
    },
  });
};

function _allowCompression(
  args: RequestArgsInternal,
  options: AnyStatsigOptions,
): boolean {
  if (!args.isCompressable) {
    return false;
  }

  // Never compress if 'no-compress' is set globally or required APIs are unavailable
  if (
    _getStatsigGlobalFlag('no-compress') != null ||
    typeof CompressionStream === 'undefined' ||
    typeof TextEncoder === 'undefined'
  ) {
    return false;
  }

  const isProxy =
    args.urlConfig.customUrl != null || args.urlConfig.fallbackUrls != null;
  const flagEnabled =
    SDKFlags.get(args.sdkKey, 'enable_log_event_compression') === true;

  switch (options.logEventCompressionMode) {
    case LogEventCompressionMode.Disabled:
      return false;

    case LogEventCompressionMode.Enabled:
      // Only compress through proxy if flag is explicitly on
      if (isProxy && !flagEnabled) {
        return false;
      }
      return true;

    case LogEventCompressionMode.Forced:
      return true;

    default:
      return false;
  }
}

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
  if (args.urlConfig.endpoint !== Endpoint._initialize) {
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
  if (args.urlConfig.endpoint !== Endpoint._initialize) {
    return;
  }

  Diagnostics._markInitNetworkReqEnd(
    args.sdkKey,
    Diagnostics._getDiagnosticsData(response, attempt, body, err),
  );
}

async function _exponentialBackoff(attempt: number): Promise<void> {
  // 1*1*1000 1s
  // 2*2*1000 4s
  // 3*3*1000 9s
  // 4*4*1000 16s
  // 5*5*1000 25s
  await new Promise((r) =>
    setTimeout(
      r,
      Math.min(BACKOFF_BASE_MS * (attempt * attempt), BACKOFF_MAX_MS),
    ),
  );
}
