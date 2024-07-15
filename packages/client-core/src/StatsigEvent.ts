import { EvaluationDetails, SecondaryExposure } from './EvaluationTypes';
import { DynamicConfig, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUserInternal } from './StatsigUser';

export type StatsigEvent = {
  eventName: string;
  value?: string | number | null;
  metadata?: { [key: string]: string | undefined } | null;
};

export type StatsigEventInternal = Omit<StatsigEvent, 'metadata'> & {
  user: StatsigUserInternal | null;
  time: number;
  metadata?: { [key: string]: unknown } | null;
  secondaryExposures?: SecondaryExposure[];
};

const CONFIG_EXPOSURE_NAME = 'statsig::config_exposure';
const GATE_EXPOSURE_NAME = 'statsig::gate_exposure';
const LAYER_EXPOSURE_NAME = 'statsig::layer_exposure';

const _createExposure = (
  eventName: string,
  user: StatsigUserInternal,
  details: EvaluationDetails,
  metadata: Record<string, string>,
  secondaryExposures: SecondaryExposure[],
) => {
  return {
    eventName,
    user,
    value: null,
    metadata: _addEvaluationDetailsToMetadata(details, metadata),
    secondaryExposures,
    time: Date.now(),
  };
};

export const _isExposureEvent = ({
  eventName,
}: StatsigEventInternal): boolean => {
  return eventName === GATE_EXPOSURE_NAME || eventName === CONFIG_EXPOSURE_NAME;
};

export const _createGateExposure = (
  user: StatsigUserInternal,
  gate: FeatureGate,
): StatsigEventInternal => {
  return _createExposure(
    GATE_EXPOSURE_NAME,
    user,
    gate.details,
    {
      gate: gate.name,
      gateValue: String(gate.value),
      ruleID: gate.ruleID,
    },
    gate.__evaluation?.secondary_exposures ?? [],
  );
};

export const _createConfigExposure = (
  user: StatsigUserInternal,
  config: DynamicConfig,
): StatsigEventInternal => {
  return _createExposure(
    CONFIG_EXPOSURE_NAME,
    user,
    config.details,
    {
      config: config.name,
      ruleID: config.ruleID,
    },
    config.__evaluation?.secondary_exposures ?? [],
  );
};

export const _createLayerParameterExposure = (
  user: StatsigUserInternal,
  layer: Layer,
  parameterName: string,
): StatsigEventInternal => {
  const evaluation = layer.__evaluation;
  const isExplicit =
    evaluation?.explicit_parameters?.includes(parameterName) === true;
  let allocatedExperiment = '';
  let secondaryExposures = evaluation?.undelegated_secondary_exposures ?? [];

  if (isExplicit) {
    allocatedExperiment = evaluation.allocated_experiment_name ?? '';
    secondaryExposures = evaluation.secondary_exposures;
  }

  return _createExposure(
    LAYER_EXPOSURE_NAME,
    user,
    layer.details,
    {
      config: layer.name,
      parameterName,
      ruleID: layer.ruleID,
      allocatedExperiment,
      isExplicitParameter: String(isExplicit),
    },
    secondaryExposures,
  );
};

const _addEvaluationDetailsToMetadata = (
  details: EvaluationDetails,
  metadata: Record<string, string>,
): Record<string, string> => {
  metadata['reason'] = details.reason;

  if (details.lcut) {
    metadata['lcut'] = String(details.lcut);
  }

  if (details.receivedAt) {
    metadata['receivedAt'] = String(details.receivedAt);
  }

  return metadata;
};
