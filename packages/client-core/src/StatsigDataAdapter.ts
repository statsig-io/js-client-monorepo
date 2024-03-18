import { StatsigOptionsCommon } from './StatsigOptionsCommon';
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

export const DataAdapterCachePrefix = 'statsig.cached';

/**
 * Describes a type that is used during intialize/update operations of a Statsig client.
 *
 * See below to find the default adapters, but know that it is possible to create your
 * own StatsigDataAdapter and provide it via {@link StatsigOptionsCommon.dataAdapter}.
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
  readonly attach: (
    sdkKey: string,
    options: StatsigOptionsCommon | null,
  ) => void;

  /**
   * (Internal Use Only) - Used by \@statsig/react-native-bindings to prime the cache from AsyncStorage
   *
   * @param {Record<string, DataAdapterResult>} cache The values to set for _inMemoryCache
   */
  readonly __setInMemoryCache: (
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
  ) => Promise<DataAdapterResult | null>;

  /**
   * Manually trigger a fetch for new evaluations data for the given user.
   *
   * @param {StatsigUser} user The StatsigUser to get data for.
   */
  readonly prefetchData: (user: StatsigUser) => Promise<void>;

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
  ) => Promise<DataAdapterResult | null>;

  /**
   * Manually trigger a fetch for new specs data.
   */
  readonly prefetchData: () => Promise<void>;

  /**
   * Manually set specs data (Bootstrap).
   */
  readonly setData: (data: string) => void;
};
