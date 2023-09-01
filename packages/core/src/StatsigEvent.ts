import { LayerSpec } from './SpecStore';
import { StatsigUser } from './StatsigUser';

export type SecondaryExposure = {
  gate: string;
  gateValue: string;
  ruleID: string;
};

export type StatsigEvent = {
  eventName: string;
  user: StatsigUser | null;
  value: string | number | null;
  metadata: object | null;
  time: number;
  secondaryExposures?: SecondaryExposure[];
};

export function createGateExposure(
  user: StatsigUser,
  gateName: string,
  gateValue: boolean,
  ruleID: string,
  secondaryExposures: SecondaryExposure[],
): StatsigEvent {
  return {
    eventName: 'statsig::gate_exposure',
    user,
    value: null,
    metadata: {
      gate: gateName,
      gateValue: String(gateValue),
      ruleID,
    },
    secondaryExposures,
    time: Date.now(),
  };
}

export function createConfigExposure(
  user: StatsigUser,
  configName: string,
  ruleID: string,
  secondaryExposures: SecondaryExposure[],
): StatsigEvent {
  return {
    eventName: 'statsig::config_exposure',
    user,
    value: null,
    metadata: {
      config: configName,
      ruleID,
    },
    secondaryExposures,
    time: Date.now(),
  };
}

export function createLayerParameterExposure(
  user: StatsigUser,
  layerName: string,
  parameterName: string,
  spec: LayerSpec,
): StatsigEvent {
  const isExplicit = spec.explicit_parameters.includes(parameterName);
  let allocatedExperiment = '';
  let secondaryExposures = spec.undelegated_secondary_exposures ?? [];
  
  if (isExplicit) {
    allocatedExperiment = spec.allocated_experiment_name;
    secondaryExposures = spec.secondary_exposures;
  }

  return {
    eventName: 'statsig::config_exposure',
    user,
    value: null,
    metadata: {
      config: layerName,
      parameterName,
      ruleID: spec.rule_id,
      allocatedExperiment,
    },
    secondaryExposures,
    time: Date.now(),
  };
}
