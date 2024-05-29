import { InjectionToken } from '@angular/core';
import { NgModule } from '@angular/core';

import { StatsigClientInterface } from '@statsig/client-core';

import { CheckGateDirective } from './checkGate.directive';
import { StatsigService } from './statsig.service';

export const STATSIG_CLIENT = new InjectionToken<StatsigClientInterface>(
  'STATSIG_CLIENT',
);

@NgModule({
  declarations: [CheckGateDirective],
  exports: [CheckGateDirective],
  providers: [StatsigService],
})
export class StatsigModule {}
