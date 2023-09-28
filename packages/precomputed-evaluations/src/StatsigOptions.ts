import { StatsigOptionsCommon } from '@sigstat/core';
import { EvaluationDataProviderInterface } from './EvaluationData';

export type StatsigOptions = StatsigOptionsCommon & {
  evaluationDataProvider?: EvaluationDataProviderInterface;
};
