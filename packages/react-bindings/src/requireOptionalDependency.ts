import {
  AnyStatsigOptions,
  Log,
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
  StatsigUser,
} from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';

export function requireOptionalClientDependency(
  sdkKey: string,
  initialUser: StatsigUser,
  statsigOptions: AnyStatsigOptions | null,
): PrecomputedEvaluationsInterface {
  let client: PrecomputedEvaluationsInterface;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const mod = require('@statsig/js-client');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    client = new mod.StatsigClient(
      sdkKey,
      initialUser,
      statsigOptions,
    ) as PrecomputedEvaluationsInterface;
  } catch (error) {
    client = NoopEvaluationsClient;
    Log.error(
      'Failed to load StatsigClient. Do you have @statsig/js-client installed?',
    );
  }

  return client;
}

export function requireOptionalOnDeviceClientDependency(
  sdkKey: string,
  statsigOptions: AnyStatsigOptions | null,
): OnDeviceEvaluationsInterface {
  let client: OnDeviceEvaluationsInterface;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const mod = require('@statsig/js-on-device-eval-client');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    client = new mod.StatsigOnDeviceEvalClient(
      sdkKey,
      statsigOptions,
    ) as OnDeviceEvaluationsInterface;
  } catch (error) {
    client = NoopEvaluationsClient;
    Log.error(
      'Failed to load StatsigClient. Do you have @statsig/js-on-device-eval-client installed?',
    );
  }

  return client;
}
