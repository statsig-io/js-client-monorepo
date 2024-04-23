import type {
  AnyStatsigOptions,
  NetworkConfigCommon,
} from './StatsigOptionsCommon';
import { StatsigUser } from './StatsigUser';

export type DataSource =
  | 'Uninitialized'
  | 'Loading'
  | 'NoValues'
  | 'Cache'
  | 'Network'
  | 'NetworkNotModified'
  | 'Bootstrap'
  | 'Prefetch';

export type DataAdapterResult = {
  readonly source: DataSource;
  readonly data: string;
  readonly receivedAt: number;
};

export type DataAdapterAsyncOptions = {
  /**
   * The maximum amount of time (in milliseconds) this operation is permitted to run.
   * If the timeout is hit, null is returned but any in-flight requests are kept alive with results going to cache for future updates.
   *
   * Note: If no timeout is given, the {@link NetworkConfigCommon.networkTimeoutMs|StatsigOptions.networkConfig.networkTimeoutMs} is used.
   */
  readonly timeoutMs?: NetworkConfigCommon['networkTimeoutMs'];
};

export const DataAdapterCachePrefix = 'statsig.cached';

/**
 * Describes a type that is used during intialize/update operations of a Statsig client.
 *
 * See below to find the default adapters, but know that it is possible to create your
 * own StatsigDataAdapter and provide it via {@link AnyStatsigOptions.dataAdapter}.
 *
 * Defaults:
 *
 * - {@link StatsigClient} uses {@link EvaluationsDataAdapter}
 *
 * - {@link StatsigOnDeviceEvalClient} uses {@link SpecsDataAdapter}
 */
type DataAdapterCommon = {
  /**
   * Called when the StatsigDataAdapter is attached to the Statsig client instance during construction.
   * @param {string} sdkKey The SDK key being used by the Statsig client.
   * @param {StatsigOptionsCommon | null} options The StatsigOptions being used by the Statsig client.
   */
  readonly attach: (sdkKey: string, options: AnyStatsigOptions | null) => void;

  /**
   * (Internal Use Only) - Used by \@statsig/react-native-bindings to prime the cache from AsyncStorage
   *
   * @param {Record<string, DataAdapterResult>} cache The values to merge into _inMemoryCache
   */
  readonly __primeInMemoryCache: (
    cache: Record<string, DataAdapterResult>,
  ) => void;
};

export type EvaluationsDataAdapter = DataAdapterCommon & {
  /**
   * Synchronously get evaluation data for the given user. Called during initializeSync and/or updateUserSync.
   *
   * It is also called during async update operations before StatsigDataAdapter.getDataAsync is called.
   * @param {StatsigUser} user The StatsigUser to get data for.
   * @returns {DataAdapterResult | null} The data that was found for the given StatsigUser.
   */
  readonly getDataSync: (user: StatsigUser) => DataAdapterResult | null;

  /**
   * Asynchronously get evaluation data for the given user. Called during initializeAsync and/or updateUserAsync.
   *
   * @param {DataAdapterResult | null} current The data that was found synchronously (Cache). Will be used as fallback if getDataAsync fails
   * @param {StatsigUser} user The StatsigUser to get data for.
   * @returns {DataAdapterResult | null} The data that was found for the given StatsigUser.
   */
  readonly getDataAsync: (
    current: DataAdapterResult | null,
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ) => Promise<DataAdapterResult | null>;

  /**
   * Manually trigger a fetch for new evaluations data for the given user.
   *
   * @param {StatsigUser} user The StatsigUser to get data for.
   */
  readonly prefetchData: (
    user: StatsigUser,
    options?: DataAdapterAsyncOptions,
  ) => Promise<void>;

  /**
   * Manually set evaluations data for the given user.
   *
   * @param {StatsigUser} user The StatsigUser this data is for.
   */
  readonly setData: (data: string, user: StatsigUser) => void;
};

export type SpecsDataAdapter = DataAdapterCommon & {
  /**
   * Synchronously get specs data. Called during initializeSync and/or updateUserSync.
   * It is also called during async update operations before StatsigDataAdapter.getDataAsync is called.
   * @returns {DataAdapterResult | null} The data that was found for the given StatsigUser.
   */
  readonly getDataSync: () => DataAdapterResult | null;

  /**
   * Asynchronously get specs data. Called during initializeAsync and/or updateUserAsync.
   *
   * @param {DataAdapterResult | null} current The data that was found synchronously (Cache). Will be used as fallback if getDataAsync fails
   * @returns {DataAdapterResult | null} The data that was found for the given StatsigUser.
   */
  readonly getDataAsync: (
    current: DataAdapterResult | null,
    options?: DataAdapterAsyncOptions,
  ) => Promise<DataAdapterResult | null>;

  /**
   * Manually trigger a fetch for new specs data.
   */
  readonly prefetchData: (options?: DataAdapterAsyncOptions) => Promise<void>;

  /**
   * Manually set specs data (Bootstrap).
   */
  readonly setData: (data: string) => void;
};
