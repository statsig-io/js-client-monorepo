import { StatsigOptionsCommon } from '@statsig-client/core';

export type StatsigOptions = StatsigOptionsCommon & {
  remoteEvalOption?: boolean;
};
