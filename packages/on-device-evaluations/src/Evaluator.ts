import { SecondaryExposure, StatsigUserInternal } from '@sigstat/core';
import { SHA256 } from '@sigstat/sha256';

import { StatsigUnsupportedEvaluationError } from './Errors';
import SpecStore, { Spec, SpecCondition, SpecRule } from './SpecStore';

const CONDITION_SEGMENT_COUNT = 10 * 1000;
const USER_BUCKET_COUNT = 1000;

export type EvaluationReason =
  | 'Network'
  | 'LocalOverride'
  | 'Unrecognized'
  | 'Uninitialized'
  | 'Bootstrap'
  | 'DataAdapter'
  | 'Unsupported';

export type EvaluationDetails = {
  readonly time: number;
  readonly reason: EvaluationReason;
};

export type ConfigEvaluation = {
  readonly value: boolean;
  readonly rule_id: string;
  readonly secondary_exposures: SecondaryExposure[];
  readonly json_value: Record<string, unknown>;
  readonly explicit_parameters: string[] | null;
  readonly config_delegate: string | null;
  readonly undelegated_secondary_exposures: SecondaryExposure[] | undefined;
  readonly is_experiment_group: boolean;
  readonly group_name: string | null;
  readonly evaluation_details: EvaluationDetails | undefined;
};

function makeConfigEvaluation(
  overrides: Partial<ConfigEvaluation>,
): ConfigEvaluation {
  const base: ConfigEvaluation = {
    value: false,
    rule_id: '',
    secondary_exposures: [],
    json_value: {},
    explicit_parameters: null,
    config_delegate: null,
    is_experiment_group: false,
    group_name: null,
    undelegated_secondary_exposures: undefined,
    evaluation_details: undefined,
  };

  return { ...base, ...overrides };
}

export default class Evaluator {
  constructor(private _store: SpecStore) {}

  public checkGate(
    user: StatsigUserInternal,
    gateName: string,
  ): ConfigEvaluation {
    const gateDef = this._store.values?.feature_gates.find(
      (gate) => gate.name === gateName,
    );
    return this._evalConfigSpec(user, gateDef);
  }

  public getConfig(
    user: StatsigUserInternal,
    configName: string,
  ): ConfigEvaluation {
    const configDef = this._store.values?.dynamic_configs.find(
      (config) => config.name === configName,
    );
    return this._evalConfigSpec(user, configDef);
  }

  public getLayer(
    user: StatsigUserInternal,
    layerName: string,
  ): ConfigEvaluation {
    const layerDef = this._store.values?.layer_configs.find(
      (layer) => layer.name === layerName,
    );
    return this._evalConfigSpec(user, layerDef);
  }

  private _evalConfigSpec(
    user: StatsigUserInternal,
    config?: Spec,
  ): ConfigEvaluation {
    if (!config) {
      return makeConfigEvaluation({
        evaluation_details: {
          time: Date.now(),
          reason: 'Unrecognized',
        },
      });
    }

    const evaulation = this._eval(user, config);
    return {
      ...evaulation,
      evaluation_details: {
        time: Date.now(),
        reason: 'Network',
      },
    };
  }

  private _eval(user: StatsigUserInternal, config: Spec): ConfigEvaluation {
    const defaultValue = _isRecord(config.defaultValue)
      ? config.defaultValue
      : undefined;

    if (!config.enabled) {
      return makeConfigEvaluation({
        rule_id: 'disabled',
        json_value: defaultValue,
      });
    }

    let secondary_exposures: SecondaryExposure[] = [];

    try {
      for (let i = 0; i < config.rules.length; i++) {
        const rule = config.rules[i];
        const ruleResult = this._evalRule(user, rule);

        secondary_exposures = secondary_exposures.concat(
          ruleResult.secondary_exposures,
        );

        if (ruleResult.value === true) {
          const delegatedResult = this._evalDelegate(
            user,
            rule,
            secondary_exposures,
          );
          if (delegatedResult) {
            return delegatedResult;
          }

          const pass = this._evalPassPercent(user, rule, config);
          return makeConfigEvaluation({
            value: pass,
            rule_id: ruleResult.rule_id,
            secondary_exposures,
            json_value: pass ? ruleResult.json_value : defaultValue,
            explicit_parameters: config.explicitParameters,
            config_delegate: ruleResult.config_delegate,
            is_experiment_group: ruleResult.is_experiment_group,
          });
        }
      }
    } catch (e: unknown) {
      if (e instanceof StatsigUnsupportedEvaluationError) {
        return makeConfigEvaluation({
          rule_id: 'default',
          secondary_exposures,
          json_value: defaultValue,
          explicit_parameters: config.explicitParameters,
          evaluation_details: {
            reason: 'Unsupported',
            time: Date.now(),
          },
        });
      }

      // other error, let error boundary handle this
      throw e;
    }

    return makeConfigEvaluation({
      rule_id: 'default',
      secondary_exposures,
      json_value: defaultValue,
      explicit_parameters: config.explicitParameters,
    });
  }

  private _evalDelegate(
    user: StatsigUserInternal,
    rule: SpecRule,
    exposures: SecondaryExposure[],
  ): ConfigEvaluation | null {
    if (rule.configDelegate == null) {
      return null;
    }

    const config = this._store.values?.dynamic_configs.find(
      (config) => config.name === rule.configDelegate,
    );
    if (!config) {
      return null;
    }

    const delegatedResult = this._eval(user, config);
    return {
      ...delegatedResult,
      config_delegate: rule.configDelegate,
      undelegated_secondary_exposures: exposures,
    };
  }

  private _evalPassPercent(
    user: StatsigUserInternal,
    rule: SpecRule,
    config: Spec,
  ): boolean {
    if (rule.passPercentage === 100) {
      return true;
    } else if (rule.passPercentage === 0) {
      return false;
    }
    const hash = _computeUserHash(
      config.salt +
        '.' +
        (rule.salt ?? rule.id) +
        '.' +
        (this._getUnitID(user, rule.idType) ?? ''),
    );
    return (
      Number(hash % BigInt(CONDITION_SEGMENT_COUNT)) < rule.passPercentage * 100
    );
  }

  private _getUnitID(user: StatsigUserInternal, idType: string) {
    if (typeof idType === 'string' && idType.toLowerCase() !== 'userid') {
      return (
        user?.customIDs?.[idType] ?? user?.customIDs?.[idType.toLowerCase()]
      );
    }
    return user?.userID;
  }

  private _evalRule(user: StatsigUserInternal, rule: SpecRule) {
    let secondaryExposures: SecondaryExposure[] = [];
    let pass = true;

    for (const condition of rule.conditions) {
      const result = this._evalCondition(user, condition);
      if (!result.passes) {
        pass = false;
      }
      if (result.exposures) {
        secondaryExposures = secondaryExposures.concat(result.exposures);
      }
    }

    return makeConfigEvaluation({
      value: pass,
      rule_id: rule.id,
      secondary_exposures: secondaryExposures,
      json_value: _isRecord(rule.returnValue) ? rule.returnValue : undefined,
      group_name: rule.groupName,
      is_experiment_group: rule.isExperimentGroup ?? false,
    });
  }

  private _evalCondition(
    user: StatsigUserInternal,
    condition: SpecCondition,
  ): {
    passes: boolean;
    exposures?: SecondaryExposure[];
  } {
    let value: unknown = null;

    const field = condition.field;
    const target = condition.targetValue;
    const idType = condition.idType;

    switch (condition.type.toLowerCase()) {
      case 'public':
        return { passes: true };
      case 'fail_gate':
      case 'pass_gate': {
        const gateResult = this._evalConfigSpec(
          user,
          this._store.values?.feature_gates.find(
            (gate) => gate.name === String(target),
          ),
        );
        value = gateResult?.value;

        const allExposures = gateResult?.secondary_exposures ?? [];
        allExposures.push({
          gate: String(target),
          gateValue: String(value),
          ruleID: gateResult?.rule_id ?? '',
        });

        return {
          passes:
            condition.type.toLowerCase() === 'fail_gate' ? !value : !!value,
          exposures: allExposures,
        };
      }
      case 'ip_based':
        // this would apply to things like 'country', 'region', etc.
        throw new StatsigUnsupportedEvaluationError(condition.type);
      case 'ua_based':
        // this would apply to things like 'os', 'browser', etc.
        throw new StatsigUnsupportedEvaluationError(condition.type);
      case 'user_field':
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
          salt + '.' + this._getUnitID(user, idType) ?? '',
        );
        value = Number(userHash % BigInt(USER_BUCKET_COUNT));
        break;
      }
      case 'unit_id':
        value = this._getUnitID(user, idType);
        break;
      default:
        throw new StatsigUnsupportedEvaluationError(condition.type);
    }

    const op = condition.operator?.toLowerCase();
    let evalResult = false;
    switch (op) {
      // numerical
      case 'gt':
        evalResult = _numberCompare((a: number, b: number) => a > b)(
          value,
          target,
        );
        break;
      case 'gte':
        evalResult = _numberCompare((a: number, b: number) => a >= b)(
          value,
          target,
        );
        break;
      case 'lt':
        evalResult = _numberCompare((a: number, b: number) => a < b)(
          value,
          target,
        );
        break;
      case 'lte':
        evalResult = _numberCompare((a: number, b: number) => a <= b)(
          value,
          target,
        );
        break;

      // version
      case 'version_gt':
        evalResult = _versionCompareHelper((result) => result > 0)(
          value as string,
          target as string,
        );
        break;
      case 'version_gte':
        evalResult = _versionCompareHelper((result) => result >= 0)(
          value as string,
          target as string,
        );
        break;
      case 'version_lt':
        evalResult = _versionCompareHelper((result) => result < 0)(
          value as string,
          target as string,
        );
        break;
      case 'version_lte':
        evalResult = _versionCompareHelper((result) => result <= 0)(
          value as string,
          target as string,
        );
        break;
      case 'version_eq':
        evalResult = _versionCompareHelper((result) => result === 0)(
          value as string,
          target as string,
        );
        break;
      case 'version_neq':
        evalResult = _versionCompareHelper((result) => result !== 0)(
          value as string,
          target as string,
        );
        break;

      // array
      case 'any':
        evalResult = _arrayAny(
          value,
          target,
          _stringCompare(true, (a, b) => a === b),
        );
        break;
      case 'none':
        evalResult = !_arrayAny(
          value,
          target,
          _stringCompare(true, (a, b) => a === b),
        );
        break;
      case 'any_case_sensitive':
        evalResult = _arrayAny(
          value,
          target,
          _stringCompare(false, (a, b) => a === b),
        );
        break;
      case 'none_case_sensitive':
        evalResult = !_arrayAny(
          value,
          target,
          _stringCompare(false, (a, b) => a === b),
        );
        break;

      // string
      case 'str_starts_with_any':
        evalResult = _arrayAny(
          value,
          target,
          _stringCompare(true, (a, b) => a.startsWith(b)),
        );
        break;
      case 'str_ends_with_any':
        evalResult = _arrayAny(
          value,
          target,
          _stringCompare(true, (a, b) => a.endsWith(b)),
        );
        break;
      case 'str_contains_any':
        evalResult = _arrayAny(
          value,
          target,
          _stringCompare(true, (a, b) => a.includes(b)),
        );
        break;
      case 'str_contains_none':
        evalResult = !_arrayAny(
          value,
          target,
          _stringCompare(true, (a, b) => a.includes(b)),
        );
        break;
      case 'str_matches':
        try {
          if (String(value).length < 1000) {
            evalResult = new RegExp(target as string).test(String(value));
          } else {
            evalResult = false;
          }
        } catch (e) {
          evalResult = false;
        }
        break;
      // strictly equals
      case 'eq':
        // eslint-disable-next-line eqeqeq
        evalResult = value == target;
        break;
      case 'neq':
        // eslint-disable-next-line eqeqeq
        evalResult = value != target;
        break;

      // dates
      case 'before':
        evalResult = _dateCompare((a, b) => a < b)(
          value as string,
          target as string,
        );
        break;
      case 'after':
        evalResult = _dateCompare((a, b) => a > b)(
          value as string,
          target as string,
        );
        break;
      case 'on':
        evalResult = _dateCompare((a, b) => {
          a?.setHours(0, 0, 0, 0);
          b?.setHours(0, 0, 0, 0);
          return a?.getTime() === b?.getTime();
        })(value as string, target as string);
        break;
      case 'in_segment_list':
      case 'not_in_segment_list':
        throw new StatsigUnsupportedEvaluationError(op);
      default:
        throw new StatsigUnsupportedEvaluationError(op);
    }
    return { passes: evalResult };
  }
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

function _numberCompare(
  fn: (a: number, b: number) => boolean,
): (a: unknown, b: unknown) => boolean {
  return (a: unknown, b: unknown) => {
    if (a == null || b == null) {
      return false;
    }
    const numA = Number(a);
    const numB = Number(b);
    if (isNaN(numA) || isNaN(numB)) {
      return false;
    }
    return fn(numA, numB);
  };
}

function _versionCompareHelper(
  fn: (res: number) => boolean,
): (a: string | null, b: string | null) => boolean {
  return (a: string | null, b: string | null) => {
    const comparison = _versionCompare(a, b);
    if (comparison == null) {
      return false;
    }
    return fn(comparison);
  };
}

// Compare two version strings without the extensions.
// returns -1, 0, or 1 if first is smaller than, equal to, or larger than second.
// returns false if any of the version strings is not valid.
function _versionCompare(
  first: string | null,
  second: string | null,
): number | null {
  if (
    first == null ||
    second == null ||
    typeof first !== 'string' ||
    typeof second !== 'string'
  ) {
    return null;
  }
  const version1 = _removeVersionExtension(first);
  const version2 = _removeVersionExtension(second);
  if (version1.length === 0 || version2.length === 0) {
    return null;
  }

  const parts1 = version1.split('.');
  const parts2 = version2.split('.');
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    if (parts1[i] === undefined) {
      parts1[i] = '0';
    }
    if (parts2[i] === undefined) {
      parts2[i] = '0';
    }
    const n1 = Number(parts1[i]);
    const n2 = Number(parts2[i]);
    if (
      typeof n1 !== 'number' ||
      typeof n2 !== 'number' ||
      isNaN(n1) ||
      isNaN(n2)
    ) {
      return null;
    }
    if (n1 < n2) {
      return -1;
    } else if (n1 > n2) {
      return 1;
    }
  }
  return 0;
}

function _removeVersionExtension(version: string): string {
  const hyphenIndex = version.indexOf('-');
  if (hyphenIndex >= 0) {
    return version.substr(0, hyphenIndex);
  }
  return version;
}

function _stringCompare(
  ignoreCase: boolean,
  fn: (a: string, b: string) => boolean,
): (a: unknown, b: unknown) => boolean {
  return (a: unknown, b: unknown): boolean => {
    if (a == null || b == null) {
      return false;
    }
    return ignoreCase
      ? fn(String(a).toLowerCase(), String(b).toLowerCase())
      : fn(String(a), String(b));
  };
}

function _dateCompare(
  fn: (a: Date, b: Date) => boolean,
): (a: string | null, b: string | null) => boolean {
  return (a: string | null, b: string | null): boolean => {
    if (a == null || b == null) {
      return false;
    }
    try {
      // Try to parse into date as a string first, if not, try unixtime
      let dateA = new Date(a);
      if (isNaN(dateA.getTime())) {
        dateA = new Date(Number(a));
      }

      let dateB = new Date(b);
      if (isNaN(dateB.getTime())) {
        dateB = new Date(Number(b));
      }
      return (
        !isNaN(dateA.getTime()) && !isNaN(dateB.getTime()) && fn(dateA, dateB)
      );
    } catch (e) {
      // malformatted input, returning false
      return false;
    }
  };
}

function _arrayAny(
  value: unknown,
  array: unknown,
  fn: (value: unknown, otherValue: unknown) => boolean,
): boolean {
  if (!Array.isArray(array)) {
    return false;
  }
  for (let i = 0; i < array.length; i++) {
    if (fn(value, array[i])) {
      return true;
    }
  }
  return false;
}

function _isRecord(obj: unknown): obj is Record<string, unknown> {
  return obj != null && typeof obj === 'object';
}
