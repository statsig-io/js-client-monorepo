import { DEFAULT_EVAL_OPTIONS, Experiment } from '@statsig/client-core';

import useDynamicConfig, { UseDynamicConfigOptions } from './useDynamicConfig';

export type UseExperimentOptions = UseDynamicConfigOptions;

export default function (
  experimentName: string,
  options: UseExperimentOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): Experiment {
  const config = useDynamicConfig(experimentName, options);
  return config;
}
