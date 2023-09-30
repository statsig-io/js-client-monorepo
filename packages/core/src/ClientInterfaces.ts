import { StatsigEvent } from './StatsigEvent';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export type StatsigLoadingStatus =
  | 'Uninitialized'
  | 'Loading'
  | 'Cache'
  | 'Bootstrap'
  | 'Network'
  | 'Error';

interface IStatsigClientCommon {
  readonly loadingStatus: StatsigLoadingStatus;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface OnDeviceEvaluationsInterface extends IStatsigClientCommon {
  checkGate(user: StatsigUser, name: string): boolean;
  getFeatureGate(user: StatsigUser, name: string): FeatureGate;
  getDynamicConfig(user: StatsigUser, name: string): DynamicConfig;
  getExperiment(user: StatsigUser, name: string): Experiment;
  getLayer(user: StatsigUser, name: string): Layer;
  logEvent(user: StatsigUser, event: StatsigEvent): void;
}

export interface PrecomputedEvaluationsInterface extends IStatsigClientCommon {
  updateUser(user: StatsigUser): Promise<void>;
  checkGate(name: string): boolean;
  getFeatureGate(name: string): FeatureGate;
  getDynamicConfig(name: string): DynamicConfig;
  getExperiment(name: string): Experiment;
  getLayer(name: string): Layer;
  logEvent(event: StatsigEvent): void;
}
