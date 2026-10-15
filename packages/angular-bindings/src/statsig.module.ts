import { NgModule } from '@angular/core';

import { CheckGateDirective } from './checkGate.directive';

export {
  FeatureGateOptions,
  STATSIG_INIT_CONFIG,
  StatsigInitConfig,
} from './statsig.providers';

@NgModule({
  declarations: [CheckGateDirective],
  exports: [CheckGateDirective],
  providers: [],
})
export class StatsigModule {}
