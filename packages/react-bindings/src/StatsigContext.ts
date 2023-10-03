import { createContext } from 'react';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

export interface StatsigContext {
  readonly precomputedClient: PrecomputedEvaluationsInterface;
  readonly onDeviceClient: OnDeviceEvaluationsInterface;
}

export default createContext<StatsigContext>({
  precomputedClient: {} as unknown as PrecomputedEvaluationsInterface,
  onDeviceClient: {} as unknown as OnDeviceEvaluationsInterface,
});
