import {
  DynamicConfig,
  DynamicConfigEvaluationOptions,
  Experiment,
  ExperimentEvaluationOptions,
  FeatureGate,
  FeatureGateEvaluationOptions,
  Layer,
  LayerEvaluationOptions,
  OverrideAdapter,
  StatsigUser,
} from '@statsig/client-core';

export class OnDeviceEvalAdapter implements OverrideAdapter {
  constructor(private readonly onDeviceEval: Record<string, unknown>) {}

  setData(data: string): void {}

  getGateOverride?(
    current: FeatureGate,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate | null {
    return null;
  }

  getDynamicConfigOverride?(
    current: DynamicConfig,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig | null {
    return null;
  }

  getExperimentOverride?(
    current: Experiment,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment | null {
    return null;
  }

  getLayerOverride?(
    current: Layer,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer | null {
    return null;
  }
}
