import {
  DynamicConfigEvaluationOptions,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  LayerEvaluationOptions,
} from './EvaluationOptions';
import { StatsigClientEventEmitterInterface } from './StatsigClientEventEmitter';
import { EvaluationsDataAdapter, SpecsDataAdapter } from './StatsigDataAdapter';
import { StatsigEvent } from './StatsigEvent';
import { StatsigRuntimeMutableOptions } from './StatsigOptionsCommon';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export interface StatsigClientCommonInterface
  extends StatsigClientEventEmitterInterface {
  initializeSync(): void;
  initializeAsync(): Promise<void>;
  shutdown(): Promise<void>;
  updateRuntimeOptions(options: StatsigRuntimeMutableOptions): void;
}

export interface OnDeviceEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: SpecsDataAdapter;
  checkGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): boolean;
  getFeatureGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate;
  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig;
  getExperiment(
    name: string,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment;
  getLayer(
    name: string,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer;
  logEvent(event: StatsigEvent, user: StatsigUser): void;
}

export interface PrecomputedEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: EvaluationsDataAdapter;

  getCurrentUser(): StatsigUser;
  updateUserSync(user: StatsigUser): void;
  updateUserAsync(user: StatsigUser): Promise<void>;
  checkGate(name: string, options?: FeatureGateEvaluationOptions): boolean;
  getFeatureGate(
    name: string,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate;
  getDynamicConfig(
    name: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig;
  getExperiment(
    name: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment;
  getLayer(name: string, options?: LayerEvaluationOptions): Layer;
  logEvent(event: StatsigEvent): void;
}

export type StatsigClientInterface =
  | OnDeviceEvaluationsInterface
  | PrecomputedEvaluationsInterface;
