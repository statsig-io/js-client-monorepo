import { InjectionToken } from '@angular/core';
import { NgModule } from '@angular/core';

import { StatsigClientInterface } from '@statsig/client-core';

import { StatsigService } from './statsig.service';

export const STATSIG_CLIENT = new InjectionToken<StatsigClientInterface>(
  'STATSIG_CLIENT',
);

@NgModule({
  providers: [StatsigService],
})
export class StatsigModule {}
