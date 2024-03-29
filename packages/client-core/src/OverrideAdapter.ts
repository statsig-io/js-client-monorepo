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

export class CombinationOverrideAdapter implements OverrideAdapter {
  constructor(public readonly providers: OverrideAdapter[]) {}

  getGateOverride(current: FeatureGate, user: StatsigUser): FeatureGate | null {
    return this._getOverride<FeatureGate>(
      (provider) => provider.getGateOverride?.(current, user) ?? null,
    );
  }

  getDynamicConfigOverride(
    current: DynamicConfig,
    user: StatsigUser,
  ): DynamicConfig | null {
    return this._getOverride<DynamicConfig>(
      (provider) => provider.getDynamicConfigOverride?.(current, user) ?? null,
    );
  }

  private _getOverride<T>(
    fn: (provider: OverrideAdapter) => T | null,
  ): T | null {
    for (const provider of this.providers) {
      const override = fn(provider);
      if (override) {
        return override;
      }
    }

    return null;
  }
}
