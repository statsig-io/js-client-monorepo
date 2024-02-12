import { LogLevel } from './Log';

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

type EmptyEvaluationArgs = {
  name: string;
  source: string;
};

function makeEmptyEvaluatedSpec(args: EmptyEvaluationArgs): EvaluatedSpec {
  return {
    ...args,
    ruleID: DEFAULT_RULE,
  };
}

export function emptyFeatureGate(args: EmptyEvaluationArgs): FeatureGate {
  return {
    ...makeEmptyEvaluatedSpec(args),
    value: false,
  };
}

export function emptyDynamicConfig(args: EmptyEvaluationArgs): DynamicConfig {
  return {
    ...makeEmptyEvaluatedSpec(args),
    value: {},
  };
}

export function emptyLayer(args: EmptyEvaluationArgs): Layer {
  return {
    ...makeEmptyEvaluatedSpec(args),
    getValue: (): unknown => undefined,
  };
}
