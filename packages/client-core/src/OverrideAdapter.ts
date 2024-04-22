import {
  DynamicConfigEvaluationOptions,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  LayerEvaluationOptions,
} from './EvaluationOptions';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export type OverrideAdapter = {
  getGateOverride?(
    current: FeatureGate,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate | null;
  getDynamicConfigOverride?(
    current: DynamicConfig,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig | null;
  getExperimentOverride?(
    current: Experiment,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment | null;
  getLayerOverride?(
    current: Layer,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer | null;
};
