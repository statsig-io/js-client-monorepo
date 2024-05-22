import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StatsigModule, StatsigService } from '@statsig/angular-bindings';

@Component({
  standalone: true,
  imports: [RouterModule, StatsigModule],
  selector: 'app-root',
  template: `<h1>Welcome angular-sample</h1>
    <router-outlet></router-outlet>`,
  styles: ``,
})
export class AppComponent {
  constructor(private _statsigService: StatsigService) {}
}
