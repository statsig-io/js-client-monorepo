import {
  DynamicConfig,
  Layer,
  StatsigClientWithLocalEvaluations,
  StatsigUser,
} from '@statsig/core';

export default class StatsigClient
  implements StatsigClientWithLocalEvaluations
{
  initialize(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  checkGate(_user: StatsigUser, _name: string): boolean {
    throw new Error('Method not implemented.');
  }
  getConfig(_user: StatsigUser, _name: string): DynamicConfig {
    throw new Error('Method not implemented.');
  }
  getExperiment(_user: StatsigUser, _name: string): DynamicConfig {
    throw new Error('Method not implemented.');
  }
  getLayer(_user: StatsigUser, _name: string): Layer {
    throw new Error('Method not implemented.');
  }
}
