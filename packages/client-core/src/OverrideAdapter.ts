import {
  DynamicConfigEvaluationOptions,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  LayerEvaluationOptions,
  ParameterStoreEvaluationOptions,
} from './EvaluationOptions';
import { EvaluationDetails } from './EvaluationTypes';
import { ParamStoreConfig } from './ParamStoreTypes';
import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  ParameterStore,
} from './StatsigTypes';
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
  getParamStoreOverride?(
    current: ParameterStore,
    options?: ParameterStoreEvaluationOptions,
  ): { config: ParamStoreConfig; details: EvaluationDetails } | null;
};
