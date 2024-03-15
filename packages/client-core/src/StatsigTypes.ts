import {
  DynamicConfigEvaluation,
  EvaluationDetails,
  ExperimentEvaluation,
  GateEvaluation,
  LayerEvaluation,
} from './EvaluationTypes';

const DEFAULT_RULE = 'default';

export type Flatten<T> = {
  [K in keyof T]: T[K];

  // Intentional: This is a utility type
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

type CommonFields = {
  readonly name: string;
  readonly ruleID: string;
  readonly details: EvaluationDetails;
};

export type SpecType = 'gate' | 'dynamic_config' | 'experiment' | 'layer';

export type FeatureGate = Flatten<
  CommonFields & {
    readonly value: boolean;
    readonly __raw: GateEvaluation | null;
  }
>;

export type DynamicConfig = Flatten<
  CommonFields & {
    readonly value: Record<string, unknown>;
    readonly __raw: DynamicConfigEvaluation | null;
  }
>;

export type Experiment = Flatten<
  CommonFields & {
    readonly value: Record<string, unknown>;
    readonly __raw: ExperimentEvaluation | null;
  }
>;

export type Layer = Flatten<
  CommonFields & {
    readonly getValue: (parameterName: string) => unknown;
    readonly __raw: LayerEvaluation | null;
  }
>;

export type AnyConfig = FeatureGate | DynamicConfig | Experiment | Layer;

export function makeFeatureGate(
  name: string,
  details: EvaluationDetails,
  evaluation: GateEvaluation | null,
): FeatureGate {
  return {
    name,
    details,
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    value: evaluation?.value === true,
    __raw: evaluation,
  };
}

export function makeDynamicConfig(
  name: string,
  details: EvaluationDetails,
  evaluation: DynamicConfigEvaluation | null,
): DynamicConfig {
  return {
    name,
    details,
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    value: evaluation?.value ?? {},
    __raw: evaluation,
  };
}

export function makeLayer(
  name: string,
  details: EvaluationDetails,
  evaluation: LayerEvaluation | null,
  getValue?: (param: string) => unknown,
): Layer {
  return {
    name,
    details,
    getValue: getValue ?? ((): unknown => undefined),
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    __raw: evaluation,
  };
}
