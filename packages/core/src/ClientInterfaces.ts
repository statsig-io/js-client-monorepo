import { StatsigEvent } from './StatsigEvent';
import { DynamicConfig, Experiment, Layer } from './StatsigTypes';
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

export interface IStatsigLocalEvalClient extends IStatsigClientCommon {
  checkGate(user: StatsigUser, name: string): boolean;
  getDynamicConfig(user: StatsigUser, name: string): DynamicConfig;
  getExperiment(user: StatsigUser, name: string): Experiment;
  getLayer(user: StatsigUser, name: string): Layer;
  logEvent(user: StatsigUser, event: StatsigEvent): void;
}

export interface IStatsigRemoteEvalClient extends IStatsigClientCommon {
  updateUser(user: StatsigUser): Promise<void>;
  checkGate(name: string): boolean;
  getDynamicConfig(name: string): DynamicConfig;
  getExperiment(name: string): Experiment;
  getLayer(name: string): Layer;
  logEvent(event: StatsigEvent): void;
}
