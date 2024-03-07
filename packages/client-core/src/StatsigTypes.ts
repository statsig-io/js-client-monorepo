const DEFAULT_RULE = 'default';

export type Flatten<T> = {
  [K in keyof T]: T[K];

  // Intentional: This is a utility type
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type EvaluationDetails = {
  reason: string;
  lcut?: number;
  receivedAt?: number;
};

type EvaluatedSpec = {
  readonly name: string;
  readonly ruleID: string;
  readonly details: EvaluationDetails;
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
  details: EvaluationDetails,
  ruleID?: string,
  value?: boolean,
): FeatureGate {
  return {
    name,
    details,
    ruleID: ruleID ?? DEFAULT_RULE,
    value: value === true,
  };
}

export function makeDynamicConfig(
  name: string,
  details: EvaluationDetails,
  ruleID?: string,
  value?: Record<string, unknown>,
): DynamicConfig {
  return {
    name,
    details,
    ruleID: ruleID ?? DEFAULT_RULE,
    value: value ?? {},
  };
}

export function makeLayer(
  name: string,
  details: EvaluationDetails,
  ruleID?: string,
  getValue?: (param: string) => unknown,
): Layer {
  return {
    name,
    details,
    getValue: getValue ?? ((): unknown => undefined),
    ruleID: ruleID ?? DEFAULT_RULE,
  };
}
