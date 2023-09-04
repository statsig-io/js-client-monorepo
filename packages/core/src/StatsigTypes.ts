import { StatsigLoadingStatus } from './StatsigClientInterfaces';

export type StatsigOptionsCommon = {
  api: string;
  localMode?: boolean;
  environment?: StatsigEnvironment;
  onLoadingStatusChanged?: (status: StatsigLoadingStatus) => void;
};

export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};

export type DynamicConfig = {
  readonly name: string;
  readonly ruleID: string;
  readonly value: Record<string, unknown>;
};

export type Experiment = DynamicConfig;

export type Layer = Omit<DynamicConfig, 'value'> & {
  readonly getValue: (parameterName: string) => unknown;
};
