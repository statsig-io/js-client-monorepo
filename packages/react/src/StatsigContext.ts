import { StatsigClient } from '@statsig/core';
import React from 'react';

export interface StatsigContext {
  client: StatsigClient;
  version: number;
}

export default React.createContext<StatsigContext>({
  client: null!,
  version: 0,
});
