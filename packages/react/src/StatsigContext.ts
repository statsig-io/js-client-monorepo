import { StatsigLocalEvalClient, StatsigRemoteEvalClient } from '@statsig/core';
import React from 'react';

export interface StatsigContext {
  readonly localEvalClient: StatsigLocalEvalClient;
  readonly remoteEvalClient: StatsigRemoteEvalClient;
  readonly version: number;
}

export default React.createContext<StatsigContext>({
  localEvalClient: null!,
  remoteEvalClient: null!,
  version: 0,
});
