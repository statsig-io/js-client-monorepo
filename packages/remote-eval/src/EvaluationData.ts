import { SecondaryExposure, StatsigUser } from '@statsig-client/core';

type Spec<T> = {
  name: string;
  value: T;
  rule_id: string;
  group_name: string;
  id_type: string;
  secondary_exposures: SecondaryExposure[];
};

export type GateEvaluation = Spec<boolean>;

export type ConfigEvaluation = Spec<Record<string, unknown>> & {
  name: string;
  rule_id: string;
  group: string;
  group_name: string;
  is_device_based: boolean;
  id_type: string;
  is_experiment_active: boolean;
  is_user_in_experiment: boolean;
};

export type LayerEvaluation = Omit<ConfigEvaluation, 'id_type'> & {
  allocated_experiment_name: string;
  explicit_parameters: string[];
  undelegated_secondary_exposures?: SecondaryExposure[];
};

export type EvaluationResponse =
  | {
      feature_gates: Record<string, GateEvaluation>;
      dynamic_configs: Record<string, ConfigEvaluation>;
      layer_configs: Record<string, LayerEvaluation>;
      time: number;
      has_updates: true;
    }
  | { has_updates: false };

export interface EvaluationDataProviderInterface {
  fetchEvaluations(user: StatsigUser): Promise<EvaluationResponse>;
}

export class LocalEvaluationDataProvider
  implements EvaluationDataProviderInterface
{
  constructor(private _data: { [userID: string]: EvaluationResponse }) {}

  fetchEvaluations(user: StatsigUser): Promise<EvaluationResponse> {
    return Promise.resolve(this._data[user.userID ?? '']);
  }
}
