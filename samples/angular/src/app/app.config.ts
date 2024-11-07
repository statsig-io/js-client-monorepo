import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { STATSIG_INIT_CONFIG } from '@statsig/angular-bindings';
import { LogLevel } from '@statsig/client-core';

import { STATSIG_CLIENT_KEY } from './Contants';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    {
      provide: STATSIG_INIT_CONFIG,
      useValue: {
        sdkKey: STATSIG_CLIENT_KEY,
        user: { userID: 'a-user' },
        options: { logLevel: LogLevel.Debug },
      },
    },
  ],
};
