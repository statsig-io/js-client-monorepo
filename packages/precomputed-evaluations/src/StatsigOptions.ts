import {
  EvaluationDataProvider,
  Flatten,
  StatsigOptionsCommon,
} from '@sigstat/core';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    dataProviders?: EvaluationDataProvider[];
  }
>;
