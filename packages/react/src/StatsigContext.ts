import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
} from '@statsig-client/core';
import React from 'react';

export interface StatsigContext {
  readonly client: IStatsigLocalEvalClient | IStatsigRemoteEvalClient;
}

export default React.createContext<StatsigContext>({
  client: null!,
});
