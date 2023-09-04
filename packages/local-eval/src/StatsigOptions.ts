import { StatsigOptionsCommon } from '@statsig/core';

export type StatsigOptions = StatsigOptionsCommon & {
  localEvalOption?: boolean;
};
