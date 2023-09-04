import { StatsigEnvironment } from '@statsig/core';

export type StatsigOptions = {
  api: string;
  localMode?: boolean;
  environment?: StatsigEnvironment;
};
