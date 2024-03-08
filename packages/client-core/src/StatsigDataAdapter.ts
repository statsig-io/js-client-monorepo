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

export type StatsigDataAdapterResult = {
  readonly source: DataSource;
  readonly data: string;
};

export type StatsigDataAdapter = {
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
   * Synchronously get data for the given user (if any). Called during initialization and updates.
   * @param {StatsigUser | undefined} user The StatsigUser to get data for.
   * @returns {StatsigDataAdapterResult | null} The data that was found for the given StatsigUser.
   */
  readonly getData: (user?: StatsigUser) => StatsigDataAdapterResult | null;

  /**
   *
   * @param {StatsigDataAdapterResult | null} result The values that were found and applied during initialization or update.
   * @param {StatsigUser | undefined} user The StatsigUser object that was used.
   */
  readonly handlePostUpdate: (
    result: StatsigDataAdapterResult | null,
    user?: StatsigUser,
  ) => Promise<void>;
};
