import {
  DynamicConfigEvaluation,
  GateEvaluation,
  LayerEvaluation,
} from './EvaluationTypes';
import { ParamStoreConfig } from './ParamStoreTypes';
import { StatsigUser } from './StatsigUser';

type SessionReplayFields = {
  can_record_session?: boolean;
  session_recording_rate?: number;
};

export type InitializeResponseWithUpdates = SessionReplayFields & {
  feature_gates: Record<string, GateEvaluation>;
  dynamic_configs: Record<string, DynamicConfigEvaluation>;
  layer_configs: Record<string, LayerEvaluation>;
  param_stores?: Record<string, ParamStoreConfig>;
  time: number;
  has_updates: true;
  hash_used: 'none' | 'sha256' | 'djb2';
  derived_fields?: Record<string, unknown>;
  user?: StatsigUser;
};

export type InitializeResponse =
  | InitializeResponseWithUpdates
  | { has_updates: false };
