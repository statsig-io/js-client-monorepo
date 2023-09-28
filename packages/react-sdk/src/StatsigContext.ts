import {
  OnDeviceEvalutationsInterface,
  PrecomputedEvalutationsInterface,
} from '@sigstat/core';
import { createContext } from 'react';

export interface StatsigContext {
  readonly client:
    | OnDeviceEvalutationsInterface
    | PrecomputedEvalutationsInterface;
}

export default createContext<StatsigContext>({
  client: null!,
});
