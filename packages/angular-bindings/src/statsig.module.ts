import { InjectionToken, NgModule } from '@angular/core';

import {
  FeatureGateEvaluationOptions,
  StatsigClient,
  StatsigOptions,
  StatsigUser,
} from '@statsig/js-client';

import { CheckGateDirective } from './checkGate.directive';

type WithClient<T extends StatsigClient> = { client: T };
type WithConfiguration = {
  sdkKey: string;
  user: StatsigUser;
  options?: StatsigOptions;
};

export type StatsigInitConfig<T extends StatsigClient> =
  | WithClient<T>
  | WithConfiguration;

export const STATSIG_INIT_CONFIG = new InjectionToken<
  StatsigInitConfig<StatsigClient>
>('StatsigProvider');

export type FeatureGateOptions = FeatureGateEvaluationOptions;

@NgModule({
  declarations: [CheckGateDirective],
  exports: [CheckGateDirective],
  providers: [],
})
export class StatsigModule {}
