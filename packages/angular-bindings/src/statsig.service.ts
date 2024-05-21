import { Injectable } from '@angular/core';

import { StatsigClient } from '@statsig/js-client';

@Injectable({
  providedIn: 'root',
})
export class StatsigService {
  private readonly _client: StatsigClient;

  constructor() {
    //
    this._client = new StatsigClient('client', {});
  }

  public initialize(): void {
    //
  }
}
