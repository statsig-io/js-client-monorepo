import {
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  LayerEvaluation,
  SecondaryExposure,
  Spec,
  SpecCondition,
  SpecRule,
  StatsigUserInternal,
  getUnitIDFromUser,
} from '@statsig/client-core';
import { SHA256 } from '@statsig/sha256';

import Compare from './EvaluationComparison';
import {
  EvaluationResult,
  makeEvalResult,
  resultToConfigEval,
  resultToGateEval,
  resultToLayerEval,
} from './EvaluationResult';
import SpecStore, { SpecAndSourceInfo, SpecKind } from './SpecStore';

const CONDITION_SEGMENT_COUNT = 10 * 1000;
const USER_BUCKET_COUNT = 1000;

type DetailedEvaluation<T> = {
  evaluation: T | null;
  details: EvaluationDetails;
};

export default class Evaluator {
  constructor(private _store: SpecStore) {}

  evaluateGate(
    name: string,
    user: StatsigUserInternal,
  ): DetailedEvaluation<GateEvaluation> {
    const { spec, details } = this._getSpecAndDetails('gate', name);
    if (!spec) {
      return { evaluation: null, details };
    }

    const evaluation = resultToGateEval(spec, this._evaluateSpec(spec, user));
    return { evaluation, details };
  }

  evaluateConfig(
    name: string,
    user: StatsigUserInternal,
  ): DetailedEvaluation<DynamicConfigEvaluation> {
    const { spec, details } = this._getSpecAndDetails('config', name);
    if (!spec) {
      return { evaluation: null, details };
    }

    const evaluation = resultToConfigEval(spec, this._evaluateSpec(spec, user));
    return { evaluation, details };
  }

  evaluateLayer(
    name: string,
    user: StatsigUserInternal,
  ): DetailedEvaluation<LayerEvaluation> {
    const { spec, details } = this._getSpecAndDetails('layer', name);
    if (!spec) {
      return { evaluation: null, details };
    }

    const result = this._evaluateSpec(spec, user);
    const experimentName = result?.allocated_experiment_name ?? '';
    const experimentSpec = this._store.getSpecAndSourceInfo(
      'config',
      experimentName,
    ).spec;
    const evaluation = resultToLayerEval(spec, experimentSpec, result);

    return { evaluation, details };
  }

  private _getSpecAndDetails(
    kind: SpecKind,
    name: string,
  ): { details: EvaluationDetails; spec: Spec | null } {
    const specAndSourceInfo = this._store.getSpecAndSourceInfo(kind, name);
    const details = this._getEvaluationDetails(specAndSourceInfo);

    return { details, spec: specAndSourceInfo.spec };
  }

  private _getEvaluationDetails(info: SpecAndSourceInfo): EvaluationDetails {
    const { source, spec, lcut, receivedAt } = info;

    if (source === 'Uninitialized' || source === 'NoValues') {
      return { reason: source };
    }

    const subreason = spec == null ? 'Unrecognized' : 'Recognized';
    const reason = `${source}:${subreason}`;

    return { reason, lcut, receivedAt };
  }

  private _evaluateSpec(
    spec: Spec,
    user: StatsigUserInternal,
  ): EvaluationResult {
    const defaultValue = _isRecord(spec.defaultValue)
      ? spec.defaultValue
      : undefined;

    if (!spec.enabled) {
      return makeEvalResult({
        json_value: defaultValue,
        rule_id: 'disabled',
      });
    }

    const exposures: SecondaryExposure[] = [];

    for (const rule of spec.rules) {
      const result = this._evaluateRule(rule, user);

      if (result.unsupported) {
        return result;
      }

      exposures.push(...result.secondary_exposures);

      if (!result.bool_value) {
        continue;
      }

      const delegateResult = this._evaluateDelegate(
        rule.configDelegate,
        user,
        exposures,
      );
      if (delegateResult) {
        return delegateResult;
      }

      const pass = _evalPassPercent(rule, user, spec);
      return makeEvalResult({
        rule_id: result.rule_id,
        bool_value: pass,
        json_value: pass ? result.json_value : defaultValue,
        secondary_exposures: exposures,
        undelegated_secondary_exposures: exposures,
        is_experiment_group: result.is_experiment_group,
        group_name: result.group_name,
      });
    }

    return makeEvalResult({
      json_value: defaultValue,
      secondary_exposures: exposures,
      undelegated_secondary_exposures: exposures,
      rule_id: 'default',
    });
  }

  private _evaluateRule(
    rule: SpecRule,
    user: StatsigUserInternal,
  ): EvaluationResult {
    const exposures: SecondaryExposure[] = [];
    let pass = true;

    for (const condition of rule.conditions) {
      const result = this._evaluateCondition(condition, user);

      if (result.unsupported) {
        return result;
      }

      exposures.push(...result.secondary_exposures);

      if (!result.bool_value) {
        pass = false;
      }
    }

    return makeEvalResult({
      rule_id: rule.id,
      bool_value: pass,
      json_value: _isRecord(rule.returnValue) ? rule.returnValue : undefined,
      secondary_exposures: exposures,
      is_experiment_group: rule.isExperimentGroup === true,
      group_name: rule.groupName,
    });
  }

  private _evaluateCondition(
    condition: SpecCondition,
    user: StatsigUserInternal,
  ): EvaluationResult {
    let value: unknown = null;
    let pass = false;

    const field = condition.field;
    const target = condition.targetValue;
    const idType = condition.idType;
    const type = condition.type;

    switch (type) {
      case 'public':
        return makeEvalResult({ bool_value: true });

      case 'pass_gate':
      case 'fail_gate': {
        const name = String(target);
        const result = this._evaluateNestedGate(name, user);
        return makeEvalResult({
          bool_value:
            type === 'fail_gate' ? !result.bool_value : result.bool_value,
          secondary_exposures: result.secondary_exposures,
        });
      }

      case 'multi_pass_gate':
      case 'multi_fail_gate':
        return this._evaluateMultiNestedGates(target, type, user);

      case 'user_field':
      case 'ip_based':
      case 'ua_based':
        value = _getFromUser(user, field);
        break;

      case 'environment_field':
        value = _getFromEnvironment(user, field);
        break;

      case 'current_time':
        value = Date.now();
        break;

      case 'user_bucket': {
        const salt = String(condition.additionalValues?.['salt'] ?? '');
        const userHash = _computeUserHash(
          salt + '.' + getUnitIDFromUser(user, idType) ?? '',
        );
        value = Number(userHash % BigInt(USER_BUCKET_COUNT));
        break;
      }

      case 'unit_id':
        value = getUnitIDFromUser(user, idType);
        break;

      default:
        return makeEvalResult({ unsupported: true });
    }

    const operator = condition.operator;

    switch (operator) {
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        pass = Compare.compareNumbers(value, target, operator);
        break;

      case 'version_gt':
      case 'version_gte':
      case 'version_lt':
      case 'version_lte':
      case 'version_eq':
      case 'version_neq':
        pass = Compare.compareVersions(value, target, operator);
        break;

      case 'any':
      case 'none':
      case 'str_starts_with_any':
      case 'str_ends_with_any':
      case 'str_contains_any':
      case 'str_contains_none':
      case 'any_case_sensitive':
      case 'none_case_sensitive':
        pass = Compare.compareStringInArray(value, target, operator);
        break;

      case 'str_matches':
        pass = Compare.compareStringWithRegEx(value, target);
        break;

      case 'before':
      case 'after':
      case 'on':
        pass = Compare.compareTime(value, target, operator);
        break;

      case 'eq':
        // eslint-disable-next-line eqeqeq
        pass = value == target;
        break;

      case 'neq':
        // eslint-disable-next-line eqeqeq
        pass = value != target;
        break;

      case 'in_segment_list':
      case 'not_in_segment_list':
        return makeEvalResult({ unsupported: true });
    }

    return makeEvalResult({ bool_value: pass });
  }

  private _evaluateDelegate(
    configDelegate: string | null,
    user: StatsigUserInternal,
    exposures: SecondaryExposure[],
  ): EvaluationResult | null {
    if (!configDelegate) {
      return null;
    }

    const { spec } = this._store.getSpecAndSourceInfo('config', configDelegate);
    if (!spec) {
      return null;
    }

    const result = this._evaluateSpec(spec, user);
    return makeEvalResult({
      ...result,
      allocated_experiment_name: configDelegate,
      explicit_parameters: spec.explicitParameters,
      secondary_exposures: exposures.concat(result.secondary_exposures),
      undelegated_secondary_exposures: exposures,
    });
  }

  private _evaluateNestedGate(
    name: string,
    user: StatsigUserInternal,
  ): EvaluationResult {
    const exposures: SecondaryExposure[] = [];
    let pass = false;

    const { spec } = this._store.getSpecAndSourceInfo('gate', name);
    if (spec) {
      const result = this._evaluateSpec(spec, user);

      if (result.unsupported) {
        return result;
      }

      pass = result.bool_value;
      exposures.push(...result.secondary_exposures);
      exposures.push({
        gate: name,
        gateValue: String(pass),
        ruleID: result.rule_id,
      });
    }

    return makeEvalResult({
      bool_value: pass,
      secondary_exposures: exposures,
    });
  }

  private _evaluateMultiNestedGates(
    gates: unknown,
    type: string,
    user: StatsigUserInternal,
  ) {
    if (!Array.isArray(gates)) {
      return makeEvalResult({ unsupported: true });
    }

    const isMultiPassType = type === 'multi_pass_gate';
    const exposures: SecondaryExposure[] = [];
    let pass = false;

    for (const name of gates) {
      if (typeof name !== 'string') {
        return makeEvalResult({ unsupported: true });
      }

      const result = this._evaluateNestedGate(name, user);

      if (result.unsupported) {
        return result;
      }

      exposures.push(...result.secondary_exposures);

      if (
        isMultiPassType
          ? result.bool_value === true
          : result.bool_value === false
      ) {
        pass = true;
        break;
      }
    }

    return makeEvalResult({
      bool_value: pass,
      secondary_exposures: exposures,
    });
  }
}

function _evalPassPercent(
  rule: SpecRule,
  user: StatsigUserInternal,
  config: Spec,
): boolean {
  if (rule.passPercentage === 100) {
    return true;
  }

  if (rule.passPercentage === 0) {
    return false;
  }

  const hash = _computeUserHash(
    config.salt +
      '.' +
      (rule.salt ?? rule.id) +
      '.' +
      (getUnitIDFromUser(user, rule.idType) ?? ''),
  );
  return (
    Number(hash % BigInt(CONDITION_SEGMENT_COUNT)) < rule.passPercentage * 100
  );
}

function _computeUserHash(userHash: string): bigint {
  const sha256 = SHA256(userHash);
  return sha256.dataView().getBigUint64(0, false);
}

function _getFromEnvironment(
  user: StatsigUserInternal,
  field: string | null,
): unknown {
  if (field == null) {
    return null;
  }
  return _getParameterCaseInsensitive(user.statsigEnvironment, field);
}

function _getParameterCaseInsensitive(
  object: Record<string, unknown> | undefined | null,
  key: string,
): unknown {
  if (object == null) {
    return undefined;
  }
  const asLowercase = key.toLowerCase();
  const keyMatch = Object.keys(object).find(
    (k) => k.toLowerCase() === asLowercase,
  );
  if (keyMatch === undefined) {
    return undefined;
  }
  return object[keyMatch];
}

function _getFromUser(
  user: StatsigUserInternal,
  field: string | null,
): unknown {
  if (field == null || typeof user !== 'object' || user == null) {
    return null;
  }
  const indexableUser = user as { [field: string]: unknown };

  return (
    indexableUser[field] ??
    indexableUser[field.toLowerCase()] ??
    user?.custom?.[field] ??
    user?.custom?.[field.toLowerCase()] ??
    user?.privateAttributes?.[field] ??
    user?.privateAttributes?.[field.toLowerCase()]
  );
}

function _isRecord(obj: unknown): obj is Record<string, unknown> {
  return obj != null && typeof obj === 'object';
}
