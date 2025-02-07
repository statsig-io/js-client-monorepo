type ParamType = 'string' | 'boolean' | 'number' | 'array' | 'object';
type RefType =
  | 'gate'
  | 'gated_value'
  | 'static'
  | 'layer'
  | 'dynamic_config'
  | 'experiment';

export type StaticParam = { ref_type: 'static' } & (
  | { param_type: 'boolean'; value: boolean }
  | { param_type: 'number'; value: number }
  | { param_type: 'string'; value: string }
  | { param_type: 'object'; value: object }
  | { param_type: 'array'; value: unknown[] }
);

export type GateParam = { ref_type: 'gate'; gate_name: string } & (
  | { param_type: 'boolean'; pass_value: boolean; fail_value: boolean }
  | { param_type: 'number'; pass_value: number; fail_value: number }
  | { param_type: 'string'; pass_value: string; fail_value: string }
  | { param_type: 'object'; pass_value: object; fail_value: object }
  | { param_type: 'array'; pass_value: unknown[]; fail_value: unknown[] }
);

type Param<R extends RefType, T extends ParamType> = {
  ref_type: R;
  param_type: T;
};

export type LayerParam = Param<'layer', ParamType> & {
  layer_name: string;
  param_name: string;
};

export type DynamicConfigParam = Param<'dynamic_config', ParamType> & {
  config_name: string;
  param_name: string;
};

export type ExperimentParam = Param<'experiment', ParamType> & {
  experiment_name: string;
  param_name: string;
};

export type AnyParam =
  | GateParam
  | StaticParam
  | LayerParam
  | DynamicConfigParam
  | ExperimentParam;

export type ParamStoreConfig = { [param_name: string]: AnyParam | undefined };
