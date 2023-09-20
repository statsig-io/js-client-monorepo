import { StatsigLoadingStatus } from './ClientInterfaces';

const DEFAULT_RULE = 'default';

export type StatsigOptionsCommon = {
  api: string;
  localMode?: boolean;
  environment?: StatsigEnvironment;
  onLoadingStatusChanged?: (status: StatsigLoadingStatus) => void;
  overrideStableID?: string;
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

export function emptyDynamicConfig(name: string): DynamicConfig | Experiment {
  return {
    name,
    ruleID: DEFAULT_RULE,
    value: {},
  };
}

export type Layer = Omit<DynamicConfig, 'value'> & {
  readonly getValue: (parameterName: string) => unknown;
};

export function emptyLayer(name: string): Layer {
  return {
    name,
    ruleID: DEFAULT_RULE,
    getValue: (): unknown => undefined,
  };
}
