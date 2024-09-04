import { createContext } from 'react';

import { PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';

export interface StatsigContext {
  readonly renderVersion: number;
  readonly client: PrecomputedEvaluationsInterface;
}

export default createContext<StatsigContext>({
  renderVersion: 0,
  client: NoopEvaluationsClient,
});
