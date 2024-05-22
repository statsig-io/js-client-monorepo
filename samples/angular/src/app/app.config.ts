import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { STATSIG_CLIENT } from '@statsig/angular-bindings';
import { LogLevel } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY } from './Contants';
import { appRoutes } from './app.routes';

const precomputedClient = new StatsigClient(
  STATSIG_CLIENT_KEY,
  { userID: 'a-user' },
  { logLevel: LogLevel.Debug },
);
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    {
      provide: STATSIG_CLIENT,
      useValue: precomputedClient,
    },
  ],
};
