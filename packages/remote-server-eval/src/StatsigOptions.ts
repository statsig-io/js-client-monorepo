import { Prettify, StatsigOptionsCommon } from '@statsig-client/core';
import { EvaluationDataProviderInterface } from './EvaluationData';

type StatsigRemoteServerEvalOptions = {
  evaluationDataProvider?: EvaluationDataProviderInterface;
};

export type StatsigOptions = Prettify<
  StatsigOptionsCommon & StatsigRemoteServerEvalOptions
>;
