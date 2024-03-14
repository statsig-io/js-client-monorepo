import { Flatten, StatsigOptionsCommon } from '@statsig/client-core';

export type StatsigOptions = Flatten<
  StatsigOptionsCommon & {
    // precomputed eval specific options
  }
>;
