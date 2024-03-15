import {
  DynamicConfigEvaluation,
  GateEvaluation,
  LayerEvaluation,
} from '@statsig/client-core';

export type EvaluationResponseWithUpdates = {
  feature_gates: Record<string, GateEvaluation>;
  dynamic_configs: Record<string, DynamicConfigEvaluation>;
  layer_configs: Record<string, LayerEvaluation>;
  time: number;
  has_updates: true;
  hash_used: 'none' | 'sha256' | 'djb2';
  derived_fields?: Record<string, unknown>;
};

export type EvaluationResponse =
  | EvaluationResponseWithUpdates
  | { has_updates: false };
