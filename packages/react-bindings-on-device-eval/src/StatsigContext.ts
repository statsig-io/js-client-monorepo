import { createContext } from 'react';

import { OnDeviceEvaluationsInterface } from '@statsig/client-core';

import { NoopOnDeviceEvalClient } from './NoopOnDeviceEvalClient';

export interface StatsigContext {
  readonly renderVersion: number;
  readonly client: OnDeviceEvaluationsInterface;
}

export default createContext<StatsigContext>({
  renderVersion: 0,
  client: NoopOnDeviceEvalClient,
});
