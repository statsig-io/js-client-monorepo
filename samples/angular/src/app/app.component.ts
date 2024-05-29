import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StatsigModule, StatsigService } from '@statsig/angular-bindings';
import { Log } from '@statsig/client-core';

@Component({
  standalone: true,
  imports: [RouterModule, StatsigModule],
  selector: 'app-root',
  template: `<h1>Welcome angular-sample</h1>
    <div *stgCheckGate="'a_gate'">a_gate: Pass</div>
    <button (click)="checkGate()">Check Gate</button>
    <router-outlet></router-outlet> `,
  styles: ``,
})
export class AppComponent {
  constructor(private _statsigService: StatsigService) {}

  checkGate(): void {
    const gate = this._statsigService.checkGate('a_gate');
    Log.debug(`Gate 'a_gate' is ${gate ? 'enabled' : 'disabled'}`);
  }
}
