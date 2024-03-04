import { StatsigClientEventEmitterInterface } from './StatsigClientEventEmitter';
import { StatsigEvent } from './StatsigEvent';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export interface StatsigClientCommonInterface
  extends StatsigClientEventEmitterInterface {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface OnDeviceEvaluationsInterface
  extends StatsigClientCommonInterface {
  checkGate(name: string, user: StatsigUser): boolean;
  getFeatureGate(name: string, user: StatsigUser): FeatureGate;
  getDynamicConfig(name: string, user: StatsigUser): DynamicConfig;
  getExperiment(name: string, user: StatsigUser): Experiment;
  getLayer(name: string, user: StatsigUser): Layer;
  logEvent(event: StatsigEvent, user: StatsigUser): void;
}

export interface PrecomputedEvaluationsInterface
  extends StatsigClientCommonInterface {
  getCurrentUser(): StatsigUser;
  updateUser(user: StatsigUser): Promise<void>;
  checkGate(name: string): boolean;
  getFeatureGate(name: string): FeatureGate;
  getDynamicConfig(name: string): DynamicConfig;
  getExperiment(name: string): Experiment;
  getLayer(name: string): Layer;
  logEvent(event: StatsigEvent): void;
}

export type StatsigClientInterface =
  | OnDeviceEvaluationsInterface
  | PrecomputedEvaluationsInterface;
