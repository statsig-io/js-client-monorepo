import {
  EvaluationsDataAdapter,
  Flatten,
  NetworkConfigCommon,
  StatsigOptionsCommon,
} from '@statsig/client-core';

type UrlOverrideOptions = Flatten<
  NetworkConfigCommon & {
    /**
     * The URL used to fetch the latest evaluations for a given user. Takes precedence over {@link StatsigOptionsCommon.api}.
     *
     * default: `https://api.statsig.com/v1/initialize`
     */
    initializeUrl?: string;
  }
>;

export type StatsigOptions = Flatten<
  StatsigOptionsCommon<UrlOverrideOptions> & {
    /**
     * An implementor of {@link EvaluationsDataAdapter}, used to customize the initialization/update flow.
     *
     * default: `StatsigEvaluationsDataAdapter`
     *
     * @see {@link https://docs.statsig.com/client/javascript-sdk/using-evaluations-data-adapter}
     */
    dataAdapter?: EvaluationsDataAdapter;
  }
>;
