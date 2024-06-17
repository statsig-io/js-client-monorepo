import {
  EvaluationDetails,
  ExperimentEvaluation,
  GateEvaluation,
  LayerEvaluation,
} from './EvaluationTypes';
import { ParamStoreConfig } from './ParamStoreTypes';
import { Flatten } from './TypingUtils';

export type TypedGet = <T = unknown>(
  key: string,
  fallback?: T,
) => TypedReturn<T>;

export type ParamStoreTypedGet = <T = unknown>(key: string, fallback: T) => T;

// prettier-ignore
export type TypedReturn<T = unknown> = 
    T extends string ? string
  : T extends number ? number
  : T extends boolean ? boolean
  : T extends Array<unknown> ? Array<unknown>
  : T extends object ? object
  : unknown;

export type SpecType = 'gate' | 'dynamic_config' | 'experiment' | 'layer';

export type FeatureGate = Flatten<{
  readonly name: string;
  readonly ruleID: string;
  readonly details: EvaluationDetails;
  readonly value: boolean;
  readonly __evaluation: GateEvaluation | null;
}>;

export type Experiment = Flatten<{
  readonly name: string;
  readonly ruleID: string;
  readonly details: EvaluationDetails;
  readonly value: Record<string, unknown>;
  readonly groupName: string | null;
  readonly __evaluation: ExperimentEvaluation | null;
  readonly get: TypedGet;
}>;

export type DynamicConfig = Flatten<Omit<Experiment, 'groupName'>>;

export type Layer = Flatten<{
  readonly name: string;
  readonly ruleID: string;
  readonly details: EvaluationDetails;
  readonly groupName: string | null;
  readonly __value: Record<string, unknown>;
  readonly __evaluation: LayerEvaluation | null;
  readonly get: TypedGet;
}>;

export type ParameterStore = Flatten<{
  readonly name: string;
  readonly details: EvaluationDetails;
  readonly get: TypedGet;
  readonly __configuration: ParamStoreConfig | null;
}>;

export type AnyConfigBasedStatsigType = DynamicConfig | Experiment | Layer;

export type AnyStatsigType = FeatureGate | AnyConfigBasedStatsigType;
