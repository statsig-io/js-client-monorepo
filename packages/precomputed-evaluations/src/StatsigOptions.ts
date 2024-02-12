import { Flatten, StatsigOptionsCommon } from '@sigstat/core';

import { EvaluationDataProviderInterface } from './EvaluationDataProvider';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    dataProviders?: EvaluationDataProviderInterface[];
  }
>;
