import { StatsigOptionsCommon } from '@statsig-client/core';
import { EvaluationDataProviderInterface } from './EvaluationData';

export type StatsigOptions = StatsigOptionsCommon & {
  evaluationDataProvider?: EvaluationDataProviderInterface;
};
