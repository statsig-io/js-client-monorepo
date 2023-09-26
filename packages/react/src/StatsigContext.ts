import {
  IStatsigOnDeviceEvalClient,
  IStatsigRemoteServerEvalClient,
} from '@statsig-client/core';
import React from 'react';

export interface StatsigContext {
  readonly client: IStatsigOnDeviceEvalClient | IStatsigRemoteServerEvalClient;
}

export default React.createContext<StatsigContext>({
  client: null!,
});
