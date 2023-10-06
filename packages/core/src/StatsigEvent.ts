import { StatsigUser } from './StatsigUser';

export type SecondaryExposure = {
  gate: string;
  gateValue: string;
  ruleID: string;
};

export type StatsigEvent = {
  eventName: string;
  value: string | number | null;
  metadata: { [key: string]: string } | null;
};

export type StatsigEventInternal = StatsigEvent & {
  user: StatsigUser | null;
  time: number;
  secondaryExposures?: SecondaryExposure[];
};

const CONFIG_EXPOSURE_NAME = 'statsig::config_exposure';
const GATE_EXPOSURE_NAME = 'statsig::gate_exposure';
const LAYER_EXPOSURE_NAME = 'statsig::layer_exposure';

function createExposure(
  eventName: string,
  user: StatsigUser,
  metadata: Record<string, string>,
  secondaryExposures: SecondaryExposure[],
) {
  return {
    eventName,
    user,
    value: null,
    metadata,
    secondaryExposures,
    time: Date.now(),
  };
}

export function isExposureEvent({ eventName }: StatsigEventInternal): boolean {
  return eventName === GATE_EXPOSURE_NAME || eventName === CONFIG_EXPOSURE_NAME;
}

export function createGateExposure(
  user: StatsigUser,
  gateName: string,
  gateValue: boolean,
  ruleID: string,
  secondaryExposures: SecondaryExposure[],
): StatsigEventInternal {
  return createExposure(
    GATE_EXPOSURE_NAME,
    user,
    {
      gate: gateName,
      gateValue: String(gateValue),
      ruleID,
    },
    secondaryExposures,
  );
}

export function createConfigExposure(
  user: StatsigUser,
  configName: string,
  ruleID: string,
  secondaryExposures: SecondaryExposure[],
): StatsigEventInternal {
  return createExposure(
    CONFIG_EXPOSURE_NAME,
    user,
    {
      config: configName,
      ruleID,
    },
    secondaryExposures,
  );
}

export function createLayerParameterExposure(
  user: StatsigUser,
  layerName: string,
  parameterName: string,
  spec: {
    rule_id: string;
    explicit_parameters: string[];
    undelegated_secondary_exposures?: SecondaryExposure[];
    secondary_exposures: SecondaryExposure[];
    allocated_experiment_name: string;
  },
): StatsigEventInternal {
  const isExplicit = spec.explicit_parameters.includes(parameterName);
  let allocatedExperiment = '';
  let secondaryExposures = spec.undelegated_secondary_exposures ?? [];

  if (isExplicit) {
    allocatedExperiment = spec.allocated_experiment_name;
    secondaryExposures = spec.secondary_exposures;
  }

  return createExposure(
    LAYER_EXPOSURE_NAME,
    user,
    {
      config: layerName,
      parameterName,
      ruleID: spec.rule_id,
      allocatedExperiment,
      isExplicitParameter: String(isExplicit),
    },
    secondaryExposures,
  );
}
