import { LogLevel } from './Log';
import { OverrideAdapter } from './OverrideAdapter';

/** Options that can be set at init and updated during runtime. */
export type StatsigRuntimeMutableOptions = {
  /**
   * Prevents writing anything to storage.
   * Note: caching will not work if storage is disabled
   */
  disableLogging?: boolean;

  /**
   * Prevents writing anything to storage.
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
   * default: `https://api.statsig.com/v1/initialize`
   */
  logEventUrl?: string;

  /**
   * The URL used to flush queued events via {@link window.navigator.sendBeacon} (web only). Takes precedence over {@link StatsigOptionsCommon.api}.
   *
   * default: `https://api.statsig.com/v1/initialize`
   */
  logEventBeaconUrl?: string;

  /**
   * The maximum amount of time (in milliseconds) that any network request can take
   * before timing out.
   *
   * default: `10,000 ms` (10 seconds)
   */
  networkTimeoutMs?: number;
};

/** Options for configuring a Statsig client. */
export type StatsigOptionsCommon<NetworkConfig extends NetworkConfigCommon> =
  StatsigRuntimeMutableOptions & {
    /**
     * Allows for fine grained control over which api or urls are hit for specific Statsig network requests.
     *
     * For defaults see {@link StatsigClientUrlOverrideOptions}
     */
    networkConfig?: NetworkConfig;

    /**
     * An object you can use to set environment variables that apply to all of your users
     * in the same session.
     */
    environment?: StatsigEnvironment;

    /**
     * Overrides the auto-generated StableID that is set for the device.
     */
    overrideStableID?: string;

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
     * default: `10,000 ms`  (10 seconds)
     */
    loggingIntervalMs?: number;

    /**
     * An implementor of {@link OverrideAdapter}, used to alter evaluations before its
     * returned to the caller of a check api (checkGate/getExperiment etc).
     */
    overrideAdapter?: OverrideAdapter;

    /**
     * (Web only) Should the 'current page' url be included with logged events.
     *
     * default: true
     */
    includeCurrentPageUrlWithEvents?: boolean;
  };

export type AnyStatsigOptions = StatsigOptionsCommon<NetworkConfigCommon>;

export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};
