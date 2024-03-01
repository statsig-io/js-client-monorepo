import { useContext } from 'react';

import {
  OnDeviceEvaluationsInterface,
  PrecomputedEvaluationsInterface,
} from '@statsig/client-core';

import StatsigContext from './StatsigContext';

export default function (): {
  precomputedClient: PrecomputedEvaluationsInterface;
  onDeviceClient: OnDeviceEvaluationsInterface;
} {
  return useContext(StatsigContext);
}
