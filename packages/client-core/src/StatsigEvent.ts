import {
  DynamicConfig,
  EvaluationDetails,
  FeatureGate,
  Layer,
} from './StatsigTypes';
import { StatsigUser } from './StatsigUser';

export type SecondaryExposure = {
  gate: string;
  gateValue: string;
  ruleID: string;
};

export type StatsigEvent = {
  eventName: string;
  value?: string | number | null;
  metadata?: { [key: string]: string } | null;
};

export type StatsigEventInternal = StatsigEvent & {
  user: StatsigUser | null;
  time: number;
  secondaryExposures?: SecondaryExposure[];
};

type LayerEvaluation = {
  explicit_parameters: string[] | null;
  undelegated_secondary_exposures?: SecondaryExposure[];
  secondary_exposures: SecondaryExposure[];
  allocated_experiment_name: string | null;
};

const CONFIG_EXPOSURE_NAME = 'statsig::config_exposure';
const GATE_EXPOSURE_NAME = 'statsig::gate_exposure';
const LAYER_EXPOSURE_NAME = 'statsig::layer_exposure';

function createExposure(
  eventName: string,
  user: StatsigUser,
  details: EvaluationDetails,
  metadata: Record<string, string>,
  secondaryExposures: SecondaryExposure[],
) {
  return {
    eventName,
    user,
    value: null,
    metadata: _addEvaluationDetailsToMetadata(details, metadata),
    secondaryExposures,
    time: Date.now(),
  };
}

export function isExposureEvent({ eventName }: StatsigEventInternal): boolean {
  return eventName === GATE_EXPOSURE_NAME || eventName === CONFIG_EXPOSURE_NAME;
}

export function createGateExposure(
  user: StatsigUser,
  gate: FeatureGate,
  secondaryExposures: SecondaryExposure[] | undefined,
): StatsigEventInternal {
  return createExposure(
    GATE_EXPOSURE_NAME,
    user,
    gate.details,
    {
      gate: gate.name,
      gateValue: String(gate.value),
      ruleID: gate.ruleID,
    },
    secondaryExposures ?? [],
  );
}

export function createConfigExposure(
  user: StatsigUser,
  config: DynamicConfig,
  secondaryExposures: SecondaryExposure[] | undefined,
): StatsigEventInternal {
  return createExposure(
    CONFIG_EXPOSURE_NAME,
    user,
    config.details,
    {
      config: config.name,
      ruleID: config.ruleID,
    },
    secondaryExposures ?? [],
  );
}

export function createLayerParameterExposure(
  user: StatsigUser,
  layer: Layer,
  parameterName: string,
  evaluation: LayerEvaluation | null,
): StatsigEventInternal {
  const isExplicit =
    evaluation?.explicit_parameters?.includes(parameterName) === true;
  let allocatedExperiment = '';
  let secondaryExposures = evaluation?.undelegated_secondary_exposures ?? [];

  if (isExplicit) {
    allocatedExperiment = evaluation.allocated_experiment_name ?? '';
    secondaryExposures = evaluation.secondary_exposures;
  }

  return createExposure(
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
}

function _addEvaluationDetailsToMetadata(
  details: EvaluationDetails,
  metadata: Record<string, string>,
): Record<string, string> {
  metadata['reason'] = details.reason;

  if (details.lcut) {
    metadata['lcut'] = String(details.lcut);
  }

  if (details.receivedAt) {
    metadata['receivedAt'] = String(details.receivedAt);
  }

  return metadata;
}
