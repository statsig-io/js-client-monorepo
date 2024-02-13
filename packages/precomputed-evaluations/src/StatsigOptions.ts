import {
  EvaluationDataProviderInterface,
  Flatten,
  StatsigOptionsCommon,
} from '@sigstat/core';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    dataProviders?: EvaluationDataProviderInterface[];
  }
>;
