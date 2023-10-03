const DEFAULT_RULE = 'default';

export type StatsigOptionsCommon = {
  api?: string;
  localMode?: boolean;
  environment?: StatsigEnvironment;
  overrideStableID?: string;
};

export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};

type EvaluatedSpec = {
  readonly name: string;
  readonly ruleID: string;
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

function makeEmptyEvaluatedSpec(name: string): EvaluatedSpec {
  return {
    name,
    ruleID: DEFAULT_RULE,
  };
}

export function emptyFeatureGate(name: string): FeatureGate {
  return {
    ...makeEmptyEvaluatedSpec(name),
    value: false,
  };
}

export function emptyDynamicConfig(name: string): DynamicConfig {
  return {
    ...makeEmptyEvaluatedSpec(name),
    value: {},
  };
}

export function emptyLayer(name: string): Layer {
  return {
    ...makeEmptyEvaluatedSpec(name),
    getValue: (): unknown => undefined,
  };
}
