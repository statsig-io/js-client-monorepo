import { Flatten, StatsigOptionsCommon } from '@sigstat/core';

import { EvaluationDataProviderInterface } from './EvaluationData';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    evaluationDataProvider?: EvaluationDataProviderInterface;
  }
>;
