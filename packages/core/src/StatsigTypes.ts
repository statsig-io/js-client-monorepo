import { LogLevel } from './Log';
import { StatsigDataProvider } from './StatsigDataProvider';

const DEFAULT_RULE = 'default';

export type Flatten<T> = {
  [K in keyof T]: T[K];

  // Intentional: This is a utility type
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type StatsigOptionsCommon = {
  api?: string;
  localMode?: boolean;
  environment?: StatsigEnvironment;
  overrideStableID?: string;
  logLevel?: LogLevel;
  dataProviders?: StatsigDataProvider[];
};

export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};

type EvaluatedSpec = {
  readonly name: string;
  readonly ruleID: string;
  readonly source: string;
};

export type FeatureGate = EvaluatedSpec & {
  readonly value: boolean;
};

export type DynamicConfig = EvaluatedSpec & {
  readonly value: Record<string, unknown>;
};
export type Experiment = DynamicConfig;

export type Layer = EvaluatedSpec & {
  readonly getValue: (parameterName: string) => unknown;
};

export function makeFeatureGate(
  name: string,
  source: string,
  ruleID?: string,
  value?: boolean,
): FeatureGate {
  return {
    name,
    source,
    ruleID: ruleID ?? DEFAULT_RULE,
    value: value === true,
  };
}

export function makeDynamicConfig(
  name: string,
  source: string,
  ruleID?: string,
  value?: Record<string, unknown>,
): DynamicConfig {
  return {
    name,
    source,
    ruleID: ruleID ?? DEFAULT_RULE,
    value: value ?? {},
  };
}

export function makeLayer(
  name: string,
  source: string,
  ruleID?: string,
  getValue?: (param: string) => unknown,
): Layer {
  return {
    name,
    source,
    getValue: getValue ?? ((): unknown => undefined),
    ruleID: ruleID ?? DEFAULT_RULE,
  };
}
