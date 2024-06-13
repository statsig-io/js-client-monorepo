import { LogLevel } from './Log';
import { NetworkArgs } from './NetworkConfig';
import { OverrideAdapter } from './OverrideAdapter';

/** Options that can be set at init and updated during runtime. */
export type StatsigRuntimeMutableOptions = {
  /**
   * Prevents sending any events over the network.
   */
  disableLogging?: boolean;

  /**
   * Prevents writing anything to storage.
   *
   * Note: caching will not work if storage is disabled
   */
  disableStorage?: boolean;
};

export type NetworkConfigCommon = {
  /**
   * The API to use for all SDK network requests. You should not need to override this
   * unless you have a custom API that implements the Statsig endpoints.
   */
  api?: string;

  /**
   * The URL used to flush queued events via a POST request. Takes precedence over {@link StatsigOptionsCommon.api}.
   *
   * default: `https://featuregates.org/v1/initialize`
   */
  logEventUrl?: string;

  /**
   * Overrides the default networking layer used by the Statsig client.
   * By default, the client use `fetch`, but overriding this
   * you could use `axios` or raw `XMLHttpRequest`
   *
   * default: `Fetch API`
   *
   * @param {string} url Where the request is going.
   * @param {NetworkArgs} args Configuration for the network request.
   * @returns {Response}
   */
  networkOverrideFunc?: (url: string, args: NetworkArgs) => Promise<Response>;

  /**
   * The maximum amount of time (in milliseconds) that any network request can take
   * before timing out.
   *
   * default: `10,000 ms` (10 seconds)
   */
  networkTimeoutMs?: number;

  /**
   * Intended for testing purposes. Prevents any network requests being made.
   */
  preventAllNetworkTraffic?: boolean;
};

/** Options for configuring a Statsig client. */
export type StatsigOptionsCommon<NetworkConfig extends NetworkConfigCommon> =
  StatsigRuntimeMutableOptions & {
    /**
     * Whether or not Statsig should compress JSON bodies for network requests where possible.
     *
     * default: `false`
     */
    disableCompression?: boolean;

    /**
     * Whether or not Statsig should use raw JSON for network requests where possible.
     *
     * default: `false`
     */
    disableStatsigEncoding?: boolean;

    /**
     * An object you can use to set environment variables that apply to all of your users
     * in the same session.
     */
    environment?: StatsigEnvironment;

    /**
     * (Web only) Should the 'current page' url be included with logged events.
     *
     * default: true
     */
    includeCurrentPageUrlWithEvents?: boolean;

    /**
     * How much information is allowed to be printed to the console.
     *
     * default: {@link LogLevel.Warn}
     */
    logLevel?: LogLevel;

    /**
     * The maximum number of events to batch before flushing logs to Statsig.
     *
     * default: `50`
     */
    loggingBufferMaxSize?: number;

    /**
     * How often (in milliseconds) to flush logs to Statsig.
     *
     * default: `10,000 ms` (10 seconds)
     */
    loggingIntervalMs?: number;

    /**
     * Allows for fine grained control over which api or urls are hit for specific Statsig network requests.
     *
     * For defaults see {@link StatsigClientUrlOverrideOptions}
     */
    networkConfig?: NetworkConfig;

    /**
     * An implementor of {@link OverrideAdapter}, used to alter evaluations before its
     * returned to the caller of a check api (checkGate/getExperiment etc).
     */
    overrideAdapter?: OverrideAdapter;

    /**
     * Overrides the auto-generated SessionID with the provided string.
     *
     * Note: Sessions still expire and will be replaced with an auto-generated SessionID.
     */
    initialSessionID?: string;
  };

export type AnyStatsigOptions = StatsigOptionsCommon<NetworkConfigCommon>;

export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};
