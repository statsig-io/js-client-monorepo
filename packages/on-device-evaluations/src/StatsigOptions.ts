import { Flatten, StatsigOptionsCommon } from '@statsig/client-core';

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
  }
>;
