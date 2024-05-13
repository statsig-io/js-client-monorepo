import {
  CustomCacheKeyGenerator,
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
     * default: `https://featuregates.org/v1/initialize`
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

    /**
     * Overrides the default cache key generation. Given the SDKKey and current
     * StatsigUser, return a key to be used for storing values related to that user.
     *
     * default: Cache key is a hash of the sdkKey + user.userID + user.customIDs.
     */
    customUserCacheKeyFunc?: CustomCacheKeyGenerator;
  }
>;
