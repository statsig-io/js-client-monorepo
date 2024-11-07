import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { StatsigModule, StatsigService } from '@statsig/angular-bindings';

import { CodeSnippetComponent } from '../codeSnippet/codeSnippet.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, StatsigModule, CodeSnippetComponent],
  templateUrl: './home.component.html',
  styleUrl: '../app.component.css',
  providers: [],
})
export class HomeComponent {
  snippet = `<div *stgCheckGate="'a_gate'">Gate passes</div>`;
  statsigServiceSnippet = `StatsigService.checkGate('a_gate')`;
  instanceSnippet = `const myStatsigClient = new StatsigClient(YOUR_SDK_KEY, user, options);
    myStatsigClient.checkGate('a_gate') `;

  constructor(private _statsigService: StatsigService) {}
}
