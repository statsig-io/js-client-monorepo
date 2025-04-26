import {
  CustomCacheKeyGenerator,
  EvaluationsDataAdapter,
  Flatten,
  NetworkConfigCommon,
  StatsigOptionsCommon,
  StatsigPlugin,
} from '@statsig/client-core';

import StatsigClient from './StatsigClient';

type UrlOverrideOptions = Flatten<
  NetworkConfigCommon & {
    /**
     * The URL used to fetch the latest evaluations for a given user. Takes precedence over {@link StatsigOptionsCommon.api}.
     *
     * default: `https://featuregates.org/v1/initialize`
     */
    initializeUrl?: string;

    /**
     * A list of URLs to try if the primary initializeUrl fails.
     */
    initializeFallbackUrls?: string[];

    /**
     * The hashing algorithm applied to the initialization response.
     *
     * default: `djb2`
     */
    initializeHashAlgorithm?: 'djb2' | 'sha256' | 'none';
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

    /**
     * Register various plugins to run along with your StatsigClient (eg SessionReplay or AutoCapture)
     */
    plugins?: StatsigPlugin<StatsigClient>[];
  }
>;
