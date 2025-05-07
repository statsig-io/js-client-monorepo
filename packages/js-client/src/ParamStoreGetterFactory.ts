import {
  DynamicConfigParam,
  ExperimentParam,
  GateParam,
  LayerParam,
  ParamStoreConfig,
  ParameterStoreEvaluationOptions,
  StaticParam,
  TypedGet,
  TypedReturn,
  _isTypeMatch,
  _typeOf,
} from '@statsig/client-core';

import StatsigClient from './StatsigClient';

const NO_EXPOSURE_OPT = {
  disableExposureLog: true,
};

function _shouldLogExposure(
  options: ParameterStoreEvaluationOptions | undefined,
) {
  return options == null || options.disableExposureLog === false;
}

function _shouldReturnFallback(value: unknown, fallback: unknown): boolean {
  return fallback != null && !_isTypeMatch(value, fallback);
}

function _getMappedStaticValue<T = unknown>(
  param: StaticParam,
  _options: ParameterStoreEvaluationOptions | undefined,
): TypedReturn<T> {
  return param.value as TypedReturn<T>;
}

function _getMappedGateValue<T = unknown>(
  client: StatsigClient,
  param: GateParam,
  options: ParameterStoreEvaluationOptions | undefined,
): TypedReturn<T> {
  const gate = client.getFeatureGate(
    param.gate_name,
    _shouldLogExposure(options) ? undefined : NO_EXPOSURE_OPT,
  );

  if (gate.value) {
    return param.pass_value as TypedReturn<T>;
  }

  return param.fail_value as TypedReturn<T>;
}

function _getMappedDynamicConfigValue<T>(
  client: StatsigClient,
  param: DynamicConfigParam,
  fallback: T,
  options: ParameterStoreEvaluationOptions | undefined,
): T {
  const config = client.getDynamicConfig(
    param.config_name,
    _shouldLogExposure(options) ? undefined : NO_EXPOSURE_OPT,
  );
  const value = config.get(param.param_name);
  if (_shouldReturnFallback(value, fallback)) {
    return fallback;
  }

  return value as T;
}

function _getMappedExperimentValue<T>(
  client: StatsigClient,
  param: ExperimentParam,
  fallback: T,
  options: ParameterStoreEvaluationOptions | undefined,
): T {
  const experiment = client.getExperiment(
    param.experiment_name,
    _shouldLogExposure(options) ? undefined : NO_EXPOSURE_OPT,
  );
  const value = experiment.get(param.param_name);
  if (_shouldReturnFallback(value, fallback)) {
    return fallback;
  }

  return value as T;
}

function _getMappedLayerValue<T>(
  client: StatsigClient,
  param: LayerParam,
  fallback: T,
  options: ParameterStoreEvaluationOptions | undefined,
): T {
  const layer = client.getLayer(
    param.layer_name,
    _shouldLogExposure(options) ? undefined : NO_EXPOSURE_OPT,
  );
  const value = layer.get(param.param_name);
  if (_shouldReturnFallback(value, fallback)) {
    return fallback;
  }

  return value as T;
}

export function _makeParamStoreGetter(
  client: StatsigClient,
  config: ParamStoreConfig | null,
  options: ParameterStoreEvaluationOptions | undefined,
): TypedGet {
  return <T = unknown>(paramName: string, fallback?: T) => {
    if (config == null) {
      return fallback as TypedReturn<T>;
    }

    const param = config[paramName];
    if (
      param == null ||
      (fallback != null && _typeOf(fallback) !== param.param_type)
    ) {
      return fallback as TypedReturn<T>;
    }

    switch (param.ref_type) {
      case 'static':
        return _getMappedStaticValue(param, options);

      case 'gate':
        return _getMappedGateValue(client, param, options);

      case 'dynamic_config':
        return _getMappedDynamicConfigValue(
          client,
          param,
          fallback,
          options,
        ) as TypedReturn<T>;

      case 'experiment':
        return _getMappedExperimentValue(
          client,
          param,
          fallback,
          options,
        ) as TypedReturn<T>;

      case 'layer':
        return _getMappedLayerValue(
          client,
          param,
          fallback,
          options,
        ) as TypedReturn<T>;

      default:
        return fallback as TypedReturn<T>;
    }
  };
}
