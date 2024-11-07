import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { StatsigModule, StatsigService } from '@statsig/angular-bindings';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, StatsigModule],
  selector: 'app-root',
  template: `
    <div>
      <nav class="container nav">
        <a routerLink="/">Home</a>
        <a routerLink="/auth">Login with Auth Example</a>
      </nav>
      <div *ngIf="isLoading | async; else content">Loading...</div>
      <ng-template #content>
        <router-outlet></router-outlet>
      </ng-template>
    </div>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  isLoading: Observable<boolean>;

  constructor(
    private router: Router,
    private statsigService: StatsigService,
  ) {
    this.isLoading = this.statsigService.isLoading$;
  }
}
