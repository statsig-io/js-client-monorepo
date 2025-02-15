import { ParamStoreConfig } from './ParamStoreTypes';
import { BootstrapMetadata } from './StatsigEvent';
import { Flatten } from './TypingUtils';

type EvaluationBase<T> = {
  id_type: string;
  name: string;
  rule_id: string;
  secondary_exposures: SecondaryExposure[] | string[];
  value: T;
  version?: string;
};

export type SecondaryExposure = {
  gate: string;
  gateValue: string;
  ruleID: string;
};

export type GateEvaluation = EvaluationBase<boolean>;

export type ExperimentEvaluation = Flatten<
  EvaluationBase<Record<string, unknown>> & {
    group_name?: string;
    group: string;
    id_type: string;
    is_device_based: boolean;
    is_experiment_active?: boolean;
    is_user_in_experiment?: boolean;
    passed?: boolean;
  }
>;

export type DynamicConfigEvaluation = ExperimentEvaluation;

export type LayerEvaluation = Flatten<
  Omit<ExperimentEvaluation, 'id_type'> & {
    allocated_experiment_name: string;
    explicit_parameters: string[];
    undelegated_secondary_exposures?: SecondaryExposure[] | string[];
  }
>;

export type AnyEvaluation =
  | GateEvaluation
  | ExperimentEvaluation
  | DynamicConfigEvaluation
  | LayerEvaluation;

export type EvaluationDetails = {
  reason: string;
  lcut?: number;
  receivedAt?: number;
  warnings?: StatsigWarnings[];
  bootstrapMetadata?: BootstrapMetadata;
};

export type DetailedStoreResult<T extends AnyEvaluation | ParamStoreConfig> = {
  result: T | null;
  details: EvaluationDetails;
};

export type StatsigWarnings =
  | 'PartialUserMatch'
  | 'StableIDMismatch'
  | 'MultipleInitializations'
  | 'NoCachedValues';
