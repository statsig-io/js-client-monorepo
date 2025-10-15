import {
  AnyStatsigOptions,
  ClientInitializeResponseOptions,
  DynamicConfigEvaluation,
  GateEvaluation,
  InitializeResponseV1WithUpdates,
  LayerEvaluation,
  SecondaryExposure,
  Spec,
  StatsigUser,
  StatsigUserInternal,
  _normalizeUser,
} from '@statsig/client-core';
import {
  EvaluationResult,
  Evaluator,
  SpecStore,
} from '@statsig/on-device-eval-core';

import { hashPrivateAttributes, hashString } from './Hashing';

export class GCIRFormatter {
  constructor(
    private _evaluator: Evaluator,
    private _store: SpecStore,
    private _options: AnyStatsigOptions,
  ) {}

  getClientInitializeResponse(
    user: StatsigUser,
    options?: ClientInitializeResponseOptions,
  ): InitializeResponseV1WithUpdates | null {
    const normalizedUser = _normalizeUser(
      user,
      this._options,
      this._store.getDefaultEnvironment(),
    );
    const hashAlgo = options?.hash ?? 'djb2';

    let targetAppID: string | null = null;
    let targetEntities: {
      gates: string[];
      configs: string[];
      experiments: string[];
    } | null = null;

    const clientSDKKey = options?.clientSDKKey;

    const clientKeyToAppMap =
      this._store.getValues()?.sdk_keys_to_app_ids ?? {};
    const hashedClientKeyToAppMap =
      this._store.getValues()?.hashed_sdk_keys_to_app_ids ?? {};
    const hashedSDKKeysToEntities =
      this._store.getValues()?.hashed_sdk_keys_to_entities ?? {};

    if (clientSDKKey) {
      const hashedKey = hashString(clientSDKKey, 'djb2');
      targetAppID = hashedClientKeyToAppMap[hashedKey] ?? null;
      targetEntities = hashedSDKKeysToEntities[hashedKey] ?? null;

      if (targetAppID == null) {
        targetAppID = clientKeyToAppMap[clientSDKKey] ?? null;
      }
    }

    const gates = this._evaluateAllGates(
      normalizedUser,
      options,
      targetAppID,
      targetEntities,
      hashAlgo,
    );
    const configs = this._evaluateAllConfigs(
      normalizedUser,
      options,
      targetAppID,
      targetEntities,
      hashAlgo,
    );
    const layers = this._evaluateAllLayers(
      normalizedUser,
      options,
      targetAppID,
      hashAlgo,
    );

    const evaluatedKeys: Record<string, unknown> = {};
    if (normalizedUser.userID) {
      evaluatedKeys['userID'] = normalizedUser.userID;
    }
    if (
      normalizedUser.customIDs &&
      Object.keys(normalizedUser.customIDs).length > 0
    ) {
      evaluatedKeys['customIDs'] = normalizedUser.customIDs;
    }

    let paHash: string | undefined = undefined;
    if (
      normalizedUser.privateAttributes &&
      Object.keys(normalizedUser.privateAttributes).length > 0
    ) {
      paHash = hashPrivateAttributes(normalizedUser.privateAttributes);
    }

    const cleanUser = { ...normalizedUser };
    delete cleanUser.privateAttributes;
    this._deleteUndefinedFields(cleanUser);

    const paramStores = this._getFilteredParamStores(targetAppID, hashAlgo);

    const response: InitializeResponseV1WithUpdates = {
      feature_gates: gates,
      dynamic_configs: configs,
      layer_configs: layers,
      param_stores: paramStores,
      sdkParams: {},
      has_updates: true,
      generator: 'js-on-device-eval-client',
      sdkInfo: { sdkType: 'js-on-device-eval-client', sdkVersion: '1.0.0' },
      time: this._store.getLastUpdateTime(),
      evaluated_keys: evaluatedKeys,
      hash_used: hashAlgo,
      user: cleanUser,
    };

    if (paramStores && Object.keys(paramStores).length > 0) {
      response.param_stores = paramStores;
    }

    if (paHash !== undefined) {
      response.pa_hash = paHash;
    }

    return response;
  }

  private _evaluateAllGates(
    user: StatsigUserInternal,
    _options?: ClientInitializeResponseOptions,
    targetAppID?: string | null,
    targetEntities?: {
      gates: string[];
      configs: string[];
      experiments: string[];
    } | null,
    hashAlgo?: 'none' | 'sha256' | 'djb2',
  ): Record<string, GateEvaluation> {
    const specs = this._store.getAllSpecs('gate');
    const result: Record<string, GateEvaluation> = {};

    for (const spec of specs) {
      if (spec.entity === 'segment' || spec.entity === 'holdout') {
        continue;
      }

      if (targetEntities != null && !targetEntities.gates.includes(spec.name)) {
        continue;
      }

      if (
        targetAppID != null &&
        !(spec.targetAppIDs ?? []).includes(targetAppID)
      ) {
        continue;
      }

      const rawResult = this._evaluateSpecForInitResponse(spec, user);
      const item = this._createInitializeResponseItem(
        spec.name,
        rawResult,
        spec,
        hashAlgo ?? 'djb2',
      ) as GateEvaluation;
      result[item.name] = item;
    }

    return result;
  }

  private _evaluateAllConfigs(
    user: StatsigUserInternal,
    _options?: ClientInitializeResponseOptions,
    targetAppID?: string | null,
    targetEntities?: {
      gates: string[];
      configs: string[];
      experiments: string[];
    } | null,
    hashAlgo?: 'none' | 'sha256' | 'djb2',
  ): Record<string, DynamicConfigEvaluation> {
    const specs = this._store.getAllSpecs('config');
    const result: Record<string, DynamicConfigEvaluation> = {};

    for (const spec of specs) {
      if (
        targetEntities != null &&
        !targetEntities.configs.includes(spec.name)
      ) {
        continue;
      }

      if (
        targetAppID != null &&
        !(spec.targetAppIDs ?? []).includes(targetAppID)
      ) {
        continue;
      }

      const rawResult = this._evaluateSpecForInitResponse(spec, user);
      const responseItem = this._createInitializeResponseItem(
        spec.name,
        rawResult,
        spec,
        hashAlgo ?? 'djb2',
      ) as DynamicConfigEvaluation;

      if (spec.entity === 'dynamic_config') {
        responseItem.passed = rawResult.bool_value;
      }

      if (spec.entity !== 'dynamic_config' && spec.entity !== 'autotune') {
        responseItem.is_user_in_experiment = rawResult.is_experiment_group;
        responseItem.is_experiment_active = spec.isActive === true;

        if (spec.hasSharedParams) {
          responseItem.is_in_layer = true;
          responseItem.explicit_parameters = spec.explicitParameters || [];

          const layerName = this._getExperimentLayer(spec.name);
          if (layerName) {
            const layerSpec = this._store
              .getAllSpecs('layer')
              .find((l) => l.name === layerName);
            if (layerSpec) {
              const layerValue =
                (layerSpec.defaultValue as Record<string, unknown>) || {};
              const currentValue =
                (responseItem.value as Record<string, unknown>) || {};
              responseItem.value = { ...layerValue, ...currentValue };
            }
          }
        }
      }

      result[responseItem.name] = responseItem;
    }

    return result;
  }

  private _evaluateAllLayers(
    user: StatsigUserInternal,
    _options?: ClientInitializeResponseOptions,
    targetAppID?: string | null,
    hashAlgo?: 'none' | 'sha256' | 'djb2',
  ): Record<string, LayerEvaluation> {
    const specs = this._store.getAllSpecs('layer');
    const result: Record<string, LayerEvaluation> = {};

    for (const spec of specs) {
      if (
        targetAppID != null &&
        !(spec.targetAppIDs ?? []).includes(targetAppID)
      ) {
        continue;
      }

      const rawResult = this._evaluateSpecForInitResponse(spec, user);
      const responseItem = this._createInitializeResponseItem(
        spec.name,
        rawResult,
        spec,
        hashAlgo ?? 'djb2',
      ) as LayerEvaluation;

      responseItem.explicit_parameters = spec.explicitParameters ?? [];

      if (rawResult.allocated_experiment_name) {
        const delegateSpec = this._store
          .getAllSpecs('config')
          .find((s) => s.name === rawResult.allocated_experiment_name);
        if (delegateSpec) {
          const delegateResult = this._evaluateSpecForInitResponse(
            delegateSpec,
            user,
          );
          if (delegateResult.group_name) {
            responseItem.group_name = delegateResult.group_name;
          }
          responseItem.allocated_experiment_name = hashString(
            rawResult.allocated_experiment_name,
            hashAlgo ?? 'djb2',
          );
          responseItem.is_experiment_active = delegateSpec.isActive === true;
          responseItem.is_user_in_experiment =
            delegateResult.is_experiment_group;
          responseItem.explicit_parameters =
            delegateSpec.explicitParameters || [];

          if (delegateResult.undelegated_secondary_exposures) {
            responseItem.undelegated_secondary_exposures =
              this._hashSecondaryExposures(
                delegateResult.undelegated_secondary_exposures,
                hashAlgo ?? 'djb2',
              );
          }
        }
      } else {
        responseItem.undelegated_secondary_exposures =
          this._hashSecondaryExposures(
            rawResult.undelegated_secondary_exposures || [],
            hashAlgo ?? 'djb2',
          );
      }

      result[responseItem.name] = responseItem;
    }

    return result;
  }

  private _createInitializeResponseItem(
    name: string,
    result: EvaluationResult,
    spec: Spec,
    hashAlgo: 'none' | 'sha256' | 'djb2',
  ): GateEvaluation | DynamicConfigEvaluation | LayerEvaluation {
    const value =
      spec.entity === 'feature_gate'
        ? result.bool_value
        : result.unsupported
          ? {}
          : result.json_value || {};

    const responseItem: any = {
      name: hashString(name, hashAlgo),
      value: value,
      rule_id: result.rule_id || 'default',
      secondary_exposures: this._hashSecondaryExposures(
        result.secondary_exposures || [],
        hashAlgo,
      ),
      id_type: spec?.idType,
    };

    if (result.group_name) {
      responseItem.group_name = result.group_name;
    }

    if (spec.entity !== 'feature_gate') {
      responseItem.group = result.group_name || '';
      responseItem.is_device_based = false;

      if (
        spec.entity !== 'dynamic_config' &&
        spec.entity !== 'autotune' &&
        spec.entity !== 'layer'
      ) {
        responseItem.is_experiment_active = spec.isActive;
        responseItem.is_user_in_experiment = result.is_experiment_group;
      }

      responseItem.passed = result.bool_value;
    }

    return responseItem;
  }

  private _evaluateSpecForInitResponse(
    spec: Spec,
    user: StatsigUserInternal,
  ): EvaluationResult {
    return this._evaluator.evaluateSpec(spec, user);
  }

  private _getFilteredParamStores(
    targetAppID: string | null,
    hashAlgo: 'none' | 'sha256' | 'djb2',
  ): Record<string, any> | undefined {
    const allParamStores = this._store.getValues()?.param_stores;
    if (!allParamStores) {
      return undefined;
    }

    const result: Record<string, Record<string, unknown>> = {};

    for (const [storeName, store] of Object.entries(allParamStores)) {
      if (targetAppID) {
        if (!store.targetAppIDs || !store.targetAppIDs.includes(targetAppID)) {
          continue;
        }
      }

      const hashedParameters: Record<string, unknown> = {};
      for (const [paramName, param] of Object.entries(store.parameters || {})) {
        const hashedParam: any = { ...param };

        if (hashedParam.gate_name) {
          hashedParam.gate_name = hashString(hashedParam.gate_name, hashAlgo);
        }
        if (hashedParam.config_name) {
          hashedParam.config_name = hashString(
            hashedParam.config_name,
            hashAlgo,
          );
        }
        if (hashedParam.layer_name) {
          hashedParam.layer_name = hashString(hashedParam.layer_name, hashAlgo);
        }
        if (hashedParam.experiment_name) {
          hashedParam.experiment_name = hashString(
            hashedParam.experiment_name,
            hashAlgo,
          );
        }

        hashedParameters[paramName] = hashedParam;
      }

      const hashedStoreName = hashString(storeName, hashAlgo);
      result[hashedStoreName] = hashedParameters;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  private _hashSecondaryExposures(
    exposures: SecondaryExposure[],
    hashAlgo: 'none' | 'sha256' | 'djb2',
  ): SecondaryExposure[] {
    if (hashAlgo === 'none') {
      return exposures;
    }

    return exposures.map((exposure) => ({
      ...exposure,
      gate: hashString(exposure.gate, hashAlgo),
    }));
  }

  private _deleteUndefinedFields<T>(obj: T): void {
    for (const key in obj) {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        this._deleteUndefinedFields(obj[key]);
      }
    }
  }

  private _getExperimentLayer(experimentName: string): string | null {
    const values = this._store.getValues();
    if (!values?.layers) {
      return null;
    }

    for (const [layerName, experiments] of Object.entries(values.layers)) {
      if (experiments.includes(experimentName)) {
        return layerName;
      }
    }

    return null;
  }
}
