import { InjectionToken } from '@angular/core';

import {
  FeatureGateEvaluationOptions,
  StatsigClient,
  StatsigOptions,
  StatsigUser,
} from '@statsig/js-client';

type WithClient<T extends StatsigClient> = { client: T };
type WithConfiguration = {
  sdkKey: string;
  user: StatsigUser;
  options?: StatsigOptions;
};

export type StatsigInitConfig<T extends StatsigClient> =
  | WithClient<T>
  | WithConfiguration;

export type FeatureGateOptions = FeatureGateEvaluationOptions;

export const STATSIG_INIT_CONFIG = new InjectionToken<
  StatsigInitConfig<StatsigClient>
>('StatsigProvider');
