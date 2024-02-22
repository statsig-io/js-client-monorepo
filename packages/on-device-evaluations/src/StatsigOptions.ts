import { StatsigDataProvider, StatsigOptionsCommon } from '@sigstat/core';

export type StatsigOptions = StatsigOptionsCommon & {
  baseDownloadConfigSpecsUrl?: string;
  dataProviders?: StatsigDataProvider[];
};
