import { SecondaryExposure } from '@statsig/client-core';

type Spec<T> = {
  name: string;
  value: T;
  rule_id: string;
  id_type: string;
  secondary_exposures: SecondaryExposure[];
};

export type GateEvaluation = Spec<boolean>;

export type ConfigEvaluation = Spec<Record<string, unknown>> & {
  name: string;
  rule_id: string;
  group: string;
  is_device_based: boolean;
  id_type: string;
  group_name?: string;
  is_user_in_experiment?: boolean;
  is_experiment_active?: boolean;
};

export type LayerEvaluation = Omit<ConfigEvaluation, 'id_type'> & {
  allocated_experiment_name: string;
  explicit_parameters: string[];
  undelegated_secondary_exposures?: SecondaryExposure[];
};

export type EvaluationResponse =
  | {
      feature_gates: Record<string, GateEvaluation>;
      dynamic_configs: Record<string, ConfigEvaluation>;
      layer_configs: Record<string, LayerEvaluation>;
      time: number;
      has_updates: true;
      hash_used: 'none' | 'sha256' | 'djb2';
      derived_fields?: Record<string, unknown>;
    }
  | { has_updates: false };
