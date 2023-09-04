import { DynamicConfig, Experiment, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export interface StatsigLocalEvalClient {
  initialize(): Promise<void>;

  checkGate(user: StatsigUser, name: string): boolean;

  getConfig(user: StatsigUser, name: string): DynamicConfig;

  getExperiment(user: StatsigUser, name: string): Experiment;

  getLayer(user: StatsigUser, name: string): Layer;
}

export interface StatsigRemoteEvalClient {
  initialize(user: StatsigUser): Promise<void>;

  updateUser(user: StatsigUser): Promise<void>;

  checkGate(name: string): boolean;

  getConfig(name: string): DynamicConfig;

  getExperiment(name: string): Experiment;

  getLayer(name: string): Layer;
}
