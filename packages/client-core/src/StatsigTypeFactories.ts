import {
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  LayerEvaluation,
} from './EvaluationTypes';
import {
  AnyConfigBasedStatsigType,
  DynamicConfig,
  FeatureGate,
  Layer,
  TypedGet,
  TypedReturn,
} from './StatsigTypes';

const DEFAULT_RULE = 'default';

export function _makeFeatureGate(
  name: string,
  details: EvaluationDetails,
  evaluation: GateEvaluation | null,
): FeatureGate {
  return {
    name,
    details,
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    value: evaluation?.value === true,
    __evaluation: evaluation,
  };
}

export function _makeDynamicConfig(
  name: string,
  details: EvaluationDetails,
  evaluation: DynamicConfigEvaluation | null,
): DynamicConfig {
  return {
    name,
    details,
    value: evaluation?.value ?? {},
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    groupName: null,
    get: _makeTypedGet(evaluation?.value),
    __evaluation: evaluation,
  };
}

export function _makeLayer(
  name: string,
  details: EvaluationDetails,
  evaluation: LayerEvaluation | null,
  exposeFunc?: (param: string) => void,
): Layer {
  return {
    name,
    details,
    get: _makeTypedGet(evaluation?.value, exposeFunc),
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    groupName: evaluation?.group_name ?? null,
    __value: evaluation?.value ?? {},
    __evaluation: evaluation,
  };
}

export function _mergeOverride<T extends AnyConfigBasedStatsigType>(
  original: T,
  overridden: T | null | undefined,
  value: Record<string, unknown>,
  exposeFunc?: (param: string) => void,
): T {
  return {
    ...original,
    ...overridden,
    get: _makeTypedGet(value, exposeFunc),
  };
}

function _isTypeMatch<T>(a: unknown, b: unknown): a is T {
  const typeOf = (x: unknown) => (Array.isArray(x) ? 'array' : typeof x);
  return typeOf(a) === typeOf(b);
}

function _makeTypedGet(
  value: Record<string, unknown> | undefined,
  exposeFunc?: (param: string) => void,
): TypedGet {
  return <T = unknown>(param: string, fallback?: T) => {
    const found = value?.[param] ?? null;

    if (found == null) {
      return (fallback ?? null) as TypedReturn<T>;
    }

    if (fallback != null && !_isTypeMatch(found, fallback)) {
      return (fallback ?? null) as TypedReturn<T>;
    }

    exposeFunc?.(param);
    return found as TypedReturn<T>;
  };
}
