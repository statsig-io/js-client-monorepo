import {
  DynamicConfigEvaluation,
  GateEvaluation,
  LayerEvaluation,
  SecondaryExposure,
} from './EvaluationTypes';
import {
  DynamicConfigEvaluationV2,
  GateEvaluationV2,
  LayerEvaluationV2,
} from './EvaluationTypesV2';
import { ParamStoreConfig } from './ParamStoreTypes';
import { StatsigUser } from './StatsigUser';

type SessionReplayFields = {
  can_record_session?: boolean;
  recording_blocked?: boolean;
  session_recording_rate?: number;
  passes_session_recording_targeting?: boolean;
  session_recording_event_triggers?: Record<string, SessionReplayTrigger>;
  session_recording_exposure_triggers?: Record<string, SessionReplayTrigger>;
  record_on_gate_check?: boolean;
  record_on_experiment_check?: boolean;
};

type SessionReplayTrigger = {
  values?: string[];
  passes_sampling?: boolean;
};

type AutoCaptureFields = {
  auto_capture_settings?: {
    disabled_events: Record<string, boolean>;
  };
};

type InitResponseCommon = SessionReplayFields &
  AutoCaptureFields & {
    param_stores?: Record<string, ParamStoreConfig>;
    time: number;
    has_updates: true;
    hash_used: 'none' | 'sha256' | 'djb2';
    user: StatsigUser;
    sdkInfo?: Record<string, string>;
    sdkParams?: Record<string, unknown>;
    generator?: string;
    evaluated_keys?: Record<string, unknown>;
    pa_hash?: string;
    derived_fields?: Record<string, unknown>;
    sdk_flags?: Record<string, boolean>;
    full_checksum?: string;
    exposures?: Record<string, SecondaryExposure>;
  };

export type InitializeResponseV1WithUpdates = InitResponseCommon & {
  feature_gates: Record<string, GateEvaluation>;
  dynamic_configs: Record<string, DynamicConfigEvaluation>;
  layer_configs: Record<string, LayerEvaluation>;
  response_format?: 'init-v1' | null | undefined;
};

export type InitializeResponseV2 = InitResponseCommon & {
  feature_gates: Record<string, GateEvaluationV2>;
  dynamic_configs: Record<string, DynamicConfigEvaluationV2>;
  layer_configs: Record<string, LayerEvaluationV2>;
  values: Record<string, Record<string, unknown>>;
  response_format: 'init-v2';
};

export type InitializeResponse =
  | InitializeResponseV1WithUpdates
  | { has_updates: false };

export type ClientInitializeResponseOptions = {
  hash?: 'none' | 'sha256' | 'djb2';
  clientSDKKey?: string;
};

export type AnyInitializeResponse =
  | InitializeResponseV1WithUpdates
  | InitializeResponseV2;
