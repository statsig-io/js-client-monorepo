import { StatsigOptionsCommon } from '@sigstat/core';

export type StatsigOptions = StatsigOptionsCommon & {
  localEvalOption?: boolean;
};
