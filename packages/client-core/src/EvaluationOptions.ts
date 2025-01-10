export type EvaluationOptionsCommon = {
  // When adding new options, add or exclude it from the memoization key in StatsigClientBase.ts

  /**
   * Prevents an exposure log being created for this check.
   *
   * default: `false`
   */
  disableExposureLog?: boolean;
};

export type FeatureGateEvaluationOptions = EvaluationOptionsCommon & {
  // Feature Gate specific options
  // When adding new options, add or exclude it from the memoization key in StatsigClientBase.ts
};

export type DynamicConfigEvaluationOptions = EvaluationOptionsCommon & {
  // Dynamic Config specific options
  // When adding new options, add or exclude it from the memoization key in StatsigClientBase.ts
};

export type ExperimentEvaluationOptions = EvaluationOptionsCommon & {
  // When adding new options, add or exclude it from the memoization key in StatsigClientBase.ts

  /**
   * Provide a map of values to be used across checks
   *
   * @requires {@link @statsig/js-user-persisted-storage}
   * @see {@link https://docs.statsig.com/client/concepts/persistent_assignment#example-usage}
   */
  userPersistedValues?: unknown;
};

export type LayerEvaluationOptions = EvaluationOptionsCommon & {
  // Layer specific options
  // When adding new options, add or exclude it from the memoization key in StatsigClientBase.ts
};

export type ParameterStoreEvaluationOptions = EvaluationOptionsCommon & {
  // Parameter Store specific options
  // When adding new options, add or exclude it from the memoization key in StatsigClientBase.ts
};

export type AnyEvaluationOptions =
  | FeatureGateEvaluationOptions
  | DynamicConfigEvaluationOptions
  | ExperimentEvaluationOptions
  | LayerEvaluationOptions
  | ParameterStoreEvaluationOptions;
