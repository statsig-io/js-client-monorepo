import { Flatten, StatsigOptionsCommon } from '@sigstat/core';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    // precomputed eval specific options
  }
>;
