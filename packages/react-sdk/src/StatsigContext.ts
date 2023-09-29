import { createContext } from 'react';

import {
  OnDeviceEvalutationsInterface,
  PrecomputedEvalutationsInterface,
} from '@sigstat/core';

export interface StatsigContext {
  readonly client:
    | OnDeviceEvalutationsInterface
    | PrecomputedEvalutationsInterface;
}

export default createContext<StatsigContext>({
  client: null!,
});
