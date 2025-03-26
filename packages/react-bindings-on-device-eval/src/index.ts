import { _getStatsigGlobal } from '@statsig/client-core';

import StatsigContext from './StatsigContext';
import {
  StatsigProviderOnDeviceEval,
  StatsigProviderOnDeviceEvalProps,
} from './StatsigProviderOnDeviceEval';
import useDynamicConfig from './useDynamicConfig';
import useExperiment from './useExperiment';
import useFeatureGate from './useFeatureGate';
import useGateValue from './useGateValue';
import useLayer from './useLayer';
import { useOnDeviceClientAsyncInit } from './useOnDeviceClientAsyncInit';
import { useOnDeviceClientBootstrapInit } from './useOnDeviceClientBootstrapInit';
import { useStatsigOnDeviceEvalClient } from './useStatsigOnDeviceEvalClient';

export type { StatsigProviderOnDeviceEvalProps };

export * from '@statsig/client-core';
export * from '@statsig/js-on-device-eval-client';

export {
  StatsigContext,
  StatsigProviderOnDeviceEval,
  useOnDeviceClientAsyncInit,
  useOnDeviceClientBootstrapInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useStatsigOnDeviceEvalClient,
};

Object.assign(_getStatsigGlobal() ?? {}, {
  StatsigContext,
  StatsigProviderOnDeviceEval,
  useOnDeviceClientAsyncInit,
  useOnDeviceClientBootstrapInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useStatsigOnDeviceEvalClient,
});
