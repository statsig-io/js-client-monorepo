import {
  Flatten,
  SpecsDataAdapter,
  StatsigOptionsCommon,
} from '@statsig/client-core';

/**
 * Extended options for configuring the Statsig SDK, incorporating common options
 * with additional specific settings.
 */
export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    /**
     * The URL used to fetch your latest Statsig configurations.
     * Default: https://api.statsigcdn.com/v1/download_config_specs
     */
    baseDownloadConfigSpecsUrl?: string;

    /**
     * An implementor of SpecsDataAdapter, used to customize the initialization/update flow.
     *
     * @default StatsigSpecsDataAdapter
     * @see {@link https://docs.statsig.com/client/javascript-sdk/using-evaluations-data-adapter}
     */
    dataAdapter?: SpecsDataAdapter;
  }
>;
