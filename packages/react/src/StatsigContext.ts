import {
  IStatsigLocalEvalClient,
  IStatsigRemoteEvalClient,
} from '@statsig/core';
import React from 'react';

export interface StatsigContext {
  readonly localEvalClient: IStatsigLocalEvalClient | null;
  readonly remoteEvalClient: IStatsigRemoteEvalClient | null;
  readonly version: number;
}

export default React.createContext<StatsigContext>({
  localEvalClient: null,
  remoteEvalClient: null,
  version: 0,
});
