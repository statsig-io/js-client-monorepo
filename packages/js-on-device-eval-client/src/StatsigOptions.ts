import {
  Flatten,
  NetworkConfigCommon,
  SpecsDataAdapter,
  StatsigOptionsCommon,
} from '@statsig/client-core';

type UrlOverrideOptions = Flatten<
  NetworkConfigCommon & {
    /**
     * The URL used to fetch your latest Statsig specifications. Takes precedence over {@link StatsigOptionsCommon.api}.
     *
     * default: `https://api.statsigcdn.com/v1/download_config_specs`
     */
    downloadConfigSpecsUrl?: string;

    /**
     * A list of URLs to try if the primary downloadConfigSpecsUrl fails.
     */
    downloadConfigSpecsFallbackUrls?: string[];
  }
>;

/**
 * Extended options for configuring the Statsig SDK, incorporating common options
 * with additional specific settings.
 */
export type StatsigOptions = Flatten<
  StatsigOptionsCommon<UrlOverrideOptions> & {
    /**
     * An implementor of {@link SpecsDataAdapter}, used to customize the initialization/update flow.
     *
     * default: `StatsigSpecsDataAdapter`
     *
     * @see {@link https://docs.statsig.com/client/javascript-sdk/using-evaluations-data-adapter}
     */
    dataAdapter?: SpecsDataAdapter;
  }
>;
