import { DEFAULT_EVAL_OPTIONS, DynamicConfig } from '@statsig/client-core';

import { UseConfigOptions, useConfigImpl } from './useConfigImpl';

export type UseDynamicConfigOptions = UseConfigOptions;

export default function (
  configName: string,
  options: UseDynamicConfigOptions = { ...DEFAULT_EVAL_OPTIONS, user: null },
): DynamicConfig {
  return useConfigImpl('useDynamicConfig', configName, options);
}
