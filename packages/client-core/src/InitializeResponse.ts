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

type AutoCaptureFields = {
  auto_capture_settings?: {
    disabled_events: Record<string, boolean>;
  };
};

export type InitializeResponseWithUpdates = SessionReplayFields &
  AutoCaptureFields & {
    feature_gates: Record<string, GateEvaluation>;
    dynamic_configs: Record<string, DynamicConfigEvaluation>;
    layer_configs: Record<string, LayerEvaluation>;
    param_stores?: Record<string, ParamStoreConfig>;
    time: number;
    has_updates: true;
    hash_used: 'none' | 'sha256' | 'djb2';
    derived_fields?: Record<string, unknown>;
    user?: StatsigUser;
    sdkInfo?: Record<string, string>;
    sdk_flags?: Record<string, boolean>;
    full_checksum?: string;
  };

export type InitializeResponse =
  | InitializeResponseWithUpdates
  | { has_updates: false };
