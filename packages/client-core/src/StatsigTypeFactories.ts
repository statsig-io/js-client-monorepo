import {
  AnyEvaluation,
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  LayerEvaluation,
} from './EvaluationTypes';
import { Log } from './Log';
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

function _makeEvaluation<T, U extends AnyEvaluation>(
  name: string,
  details: EvaluationDetails,
  evaluation: U | null,
  value: T,
) {
  return {
    name,
    details,
    ruleID: evaluation?.rule_id ?? '',
    __evaluation: evaluation,
    value,
  };
}

export function _makeFeatureGate(
  name: string,
  details: EvaluationDetails,
  evaluation: GateEvaluation | null,
): FeatureGate {
  return {
    ..._makeEvaluation(name, details, evaluation, evaluation?.value === true),
    idType: evaluation?.id_type ?? null,
  };
}

export function _makeDynamicConfig(
  name: string,
  details: EvaluationDetails,
  evaluation: DynamicConfigEvaluation | null,
): DynamicConfig {
  const value = evaluation?.value ?? {};
  return {
    ..._makeEvaluation(name, details, evaluation, value),
    get: _makeTypedGet(name, evaluation?.value),
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
    get: _makeTypedGet(name, evaluation?.value, exposeFunc),
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
    get: _makeTypedGet(original.name, value, exposeFunc),
  };
}

export function _makeTypedGet(
  name: string,
  value: Record<string, unknown> | undefined,
  exposeFunc?: (param: string) => void,
): TypedGet {
  return <T = unknown>(param: string, fallback?: T) => {
    const found = value?.[param] ?? null;

    if (found == null) {
      return (fallback ?? null) as TypedReturn<T>;
    }

    if (fallback != null && !_isTypeMatch(found, fallback)) {
      Log.warn(
        `Parameter type mismatch. '${name}.${param}' was found to be type '${typeof found}' but fallback/return type is '${typeof fallback}'. See https://docs.statsig.com/client/javascript-sdk/#typed-getters`,
      );
      return (fallback ?? null) as TypedReturn<T>;
    }

    exposeFunc?.(param);
    return found as TypedReturn<T>;
  };
}
