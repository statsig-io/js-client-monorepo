import {
  DynamicConfigEvaluation,
  GateEvaluation,
  LayerEvaluation,
  ParamStoreConfig,
  SecondaryExposure,
} from '@statsig/client-core';

export interface InitializeContainer {
  getGate(name: string): GateEvaluation | null;
  getConfig(name: string): DynamicConfigEvaluation | null;
  getLayer(name: string): LayerEvaluation | null;
  getParamStore(name: string): ParamStoreConfig | null;
  getConfigList(): string[];
  getExposureMapping(): Record<string, SecondaryExposure> | undefined;
}
