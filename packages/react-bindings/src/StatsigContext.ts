import { createContext } from 'react';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

export interface StatsigContext {
  readonly renderVersion: number;
  readonly precomputedClient: PrecomputedEvaluationsInterface;
  readonly onDeviceClient: OnDeviceEvaluationsInterface;
}

export default createContext<StatsigContext>({
  renderVersion: 0,
  precomputedClient: {} as unknown as PrecomputedEvaluationsInterface,
  onDeviceClient: {} as unknown as OnDeviceEvaluationsInterface,
});
