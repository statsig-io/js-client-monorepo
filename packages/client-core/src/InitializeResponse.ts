import {
  DynamicConfigEvaluation,
  GateEvaluation,
  LayerEvaluation,
  SecondaryExposure,
} from './EvaluationTypes';
import { ParamStoreConfig } from './ParamStoreTypes';
import { StatsigUser } from './StatsigUser';

type SessionReplayFields = {
  can_record_session?: boolean;
  session_recording_rate?: number;
  passes_session_recording_targeting?: boolean;
  session_recording_event_triggers?: Record<string, SessionReplayTrigger>;
  session_recording_exposure_triggers?: Record<string, SessionReplayTrigger>;
};

type SessionReplayTrigger = {
  values?: string[];
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
    exposures?: Record<string, SecondaryExposure>;
  };

export type InitializeResponse =
  | InitializeResponseWithUpdates
  | { has_updates: false };
