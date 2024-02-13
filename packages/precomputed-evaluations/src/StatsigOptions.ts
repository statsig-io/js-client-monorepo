import { Flatten, StatsigOptionsCommon } from '@sigstat/core';

import { EvaluationDataProviderInterface } from '../../core/src/EvaluationDataProvider';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    dataProviders?: EvaluationDataProviderInterface[];
  }
>;
