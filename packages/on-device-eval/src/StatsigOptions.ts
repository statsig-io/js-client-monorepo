import { StatsigOptionsCommon } from 'dloomb-client-core';

export type StatsigOptions = StatsigOptionsCommon & {
  localEvalOption?: boolean;
};
