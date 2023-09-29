import { createContext } from 'react';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@sigstat/core';

export interface StatsigContext {
  readonly client:
    | OnDeviceEvaluationsInterface
    | PrecomputedEvaluationsInterface;
}

export default createContext<StatsigContext>({
  client: null!,
});
