import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
} from '@statsig/core';
import React from 'react';

export interface StatsigContext {
  readonly client: IStatsigLocalEvalClient | IStatsigRemoteEvalClient;
  readonly version: number;
}

export default React.createContext<StatsigContext>({
  client: null!,
  version: 0,
});
