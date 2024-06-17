import {
  AnyEvaluation,
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  LayerEvaluation,
} from './EvaluationTypes';
import {
  AnyConfigBasedStatsigType,
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  TypedGet,
  TypedReturn,
} from './StatsigTypes';
import { _isTypeMatch } from './TypingUtils';

const DEFAULT_RULE = 'default';

function _makeEvaluation<T, U extends AnyEvaluation>(
  name: string,
  details: EvaluationDetails,
  evaluation: U | null,
  value: T,
) {
  return {
    name,
    details,
    ruleID: evaluation?.rule_id ?? DEFAULT_RULE,
    __evaluation: evaluation,
    value,
  };
}

export function _makeFeatureGate(
  name: string,
  details: EvaluationDetails,
  evaluation: GateEvaluation | null,
): FeatureGate {
  return _makeEvaluation(name, details, evaluation, evaluation?.value === true);
}

export function _makeDynamicConfig(
  name: string,
  details: EvaluationDetails,
  evaluation: DynamicConfigEvaluation | null,
): DynamicConfig {
  const value = evaluation?.value ?? {};
  return {
    ..._makeEvaluation(name, details, evaluation, value),
    get: _makeTypedGet(evaluation?.value),
  };
}

export function _makeExperiment(
  name: string,
  details: EvaluationDetails,
  evaluation: DynamicConfigEvaluation | null,
): Experiment {
  const result = _makeDynamicConfig(name, details, evaluation);
  return {
    ...result,
    groupName: evaluation?.group_name ?? null,
  };
}

export function _makeLayer(
  name: string,
  details: EvaluationDetails,
  evaluation: LayerEvaluation | null,
  exposeFunc?: (param: string) => void,
): Layer {
  return {
    ..._makeEvaluation(name, details, evaluation, undefined),
    get: _makeTypedGet(evaluation?.value, exposeFunc),
    groupName: evaluation?.group_name ?? null,
    __value: evaluation?.value ?? {},
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

export function _makeTypedGet(
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
