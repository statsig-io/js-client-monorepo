import { DynamicConfig, Experiment, Layer } from './StatsigTypes';
import StatsigClient from './StatsigClient';
import { StatsigOptions } from './StatsigOptions';
import { StatsigUser } from './StatsigUser';

export default class Statsig {
  private static _instance: StatsigClient | null = null;

  static async initialize(
    sdkKey: string,
    user: StatsigUser,
    options: StatsigOptions | null = null,
  ): Promise<void> {
    this._instance = new StatsigClient(sdkKey, options);
    await this._instance.initialize(user);
  }

  static async updateUser(user: StatsigUser) {
    await this._instance?.updateUser(user);
  }

  static checkGate(name: string): boolean {
    return this._instance?.checkGate(name) ?? false;
  }

  static getConfig(name: string): DynamicConfig {
    return this._instance!.getConfig(name);
  }

  static getExperiment(name: string): Experiment {
    return this._instance!.getExperiment(name);
  }

  static getLayer(name: string): Layer {
    return this._instance!.getLayer(name);
  }
}
