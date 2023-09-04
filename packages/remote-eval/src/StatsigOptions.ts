import { StatsigOptionsCommon } from '@statsig/core';

export type StatsigOptions = StatsigOptionsCommon & {
  remoteEvalOption?: boolean;
};
