import {
  EvaluationsDataAdapter,
  Flatten,
  StatsigOptionsCommon,
} from '@statsig/client-core';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    /**
     * An implementor of EvaluationsDataAdapter, used to customize the initialization/update flow.
     *
     * @default {StatsigEvaluationsDataAdapter}
     * @see {@link https://docs.statsig.com/client/javascript-sdk/using-evaluations-data-adapter}
     */
    dataAdapter?: EvaluationsDataAdapter;
  }
>;
