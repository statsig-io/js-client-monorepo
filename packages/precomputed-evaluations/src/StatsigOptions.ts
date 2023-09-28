import { StatsigOptionsCommon } from 'dloomb-client-core';
import { EvaluationDataProviderInterface } from './EvaluationData';

export type StatsigOptions = StatsigOptionsCommon & {
  evaluationDataProvider?: EvaluationDataProviderInterface;
};
