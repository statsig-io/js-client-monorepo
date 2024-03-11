import { EvaluationOptions } from './StatsigClientBase';
import { StatsigClientEventEmitterInterface } from './StatsigClientEventEmitter';
import { StatsigDataAdapter } from './StatsigDataAdapter';
import { StatsigEvent } from './StatsigEvent';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export interface StatsigClientCommonInterface
  extends StatsigClientEventEmitterInterface {
  initializeSync(): void;
  initializeAsync(): Promise<void>;
  shutdown(): Promise<void>;
  getDataAdapter(): StatsigDataAdapter;
}

export interface OnDeviceEvaluationsInterface
  extends StatsigClientCommonInterface {
  checkGate(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions,
  ): boolean;
  getFeatureGate(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions,
  ): FeatureGate;
  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions,
  ): DynamicConfig;
  getExperiment(
    name: string,
    user: StatsigUser,
    options: EvaluationOptions,
  ): Experiment;
  getLayer(name: string, user: StatsigUser, options: EvaluationOptions): Layer;
  logEvent(event: StatsigEvent, user: StatsigUser): void;
}

export interface PrecomputedEvaluationsInterface
  extends StatsigClientCommonInterface {
  getCurrentUser(): StatsigUser;
  updateUserSync(user: StatsigUser): void;
  updateUserAsync(user: StatsigUser): Promise<void>;
  checkGate(name: string, options: EvaluationOptions): boolean;
  getFeatureGate(name: string, options: EvaluationOptions): FeatureGate;
  getDynamicConfig(name: string, options: EvaluationOptions): DynamicConfig;
  getExperiment(name: string, options: EvaluationOptions): Experiment;
  getLayer(name: string, options: EvaluationOptions): Layer;
  logEvent(event: StatsigEvent): void;
}

export type StatsigClientInterface =
  | OnDeviceEvaluationsInterface
  | PrecomputedEvaluationsInterface;
