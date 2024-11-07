import 'jest-preset-angular/setup-jest';

import { StatsigClientInterface } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY } from './app/Contants';

// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};

export function getTestClient(): StatsigClientInterface {
  const precomputedClient = new StatsigClient(STATSIG_CLIENT_KEY, {
    userID: 'a-user',
  });
  precomputedClient.initializeSync();
  return precomputedClient;
}
