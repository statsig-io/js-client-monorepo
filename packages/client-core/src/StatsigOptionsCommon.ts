import { LogLevel } from './Log';

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

/** Options for configuring a Statsig client. */
export type StatsigOptionsCommon = StatsigRuntimeMutableOptions & {
  /**
   * The API to use for all SDK network requests. You should not need to override this
   * unless you have another API that implements the Statsig API endpoints.
   */
  api?: string;

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
   * Default: LogLevel.Warn
   */
  logLevel?: LogLevel;

  /**
   * The maximum amount of time (in milliseconds) that any network request can take
   * before timing out. Default: 10,000 (10 seconds)
   */
  networkTimeoutMs?: number;

  /**
   * The maximum number of events to batch before flushing logs to Statsig.
   * Default: 50
   */
  loggingBufferMaxSize?: number;

  /**
   * How often (in milliseconds) to flush logs to Statsig.
   * Default: 10,000 (10 seconds)
   */
  loggingIntervalMs?: number;
};

export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};
