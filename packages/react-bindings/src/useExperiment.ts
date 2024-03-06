import { DEFAULT_EVAL_OPTIONS, Experiment } from '@statsig/client-core';

import { UseConfigOptions, useConfigImpl } from './useConfigImpl';

export type UseExperimentOptions = UseConfigOptions;

export default function (
  experimentName: string,
  options: UseExperimentOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): Experiment {
  return useConfigImpl('useExperiment', experimentName, options);
}
