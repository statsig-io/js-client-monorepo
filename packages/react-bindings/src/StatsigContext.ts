import { createContext } from 'react';

import { StatsigClientInterface } from '@statsig/client-core';

import { NoopEvaluationsClient } from './NoopEvaluationsClient';

export interface StatsigContext {
  readonly renderVersion: number;
  readonly client: StatsigClientInterface;
}

export default createContext<StatsigContext>({
  renderVersion: 0,
  client: NoopEvaluationsClient,
});
