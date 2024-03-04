import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';

export type StatsigLoadingStatus =
  | 'Uninitialized'
  | 'Loading'
  | 'Ready'
  | 'Error';

export type StatsigClientEvent =
  | 'status_change'
  | 'error'
  | 'logs_flushed'
  | 'gate_evaluation'
  | 'dynamic_config_evaluation'
  | 'experiment_evaluation'
  | 'layer_evaluation';

export type StatsigClientEventData =
  | {
      event: StatsigClientEvent;
    }
  | {
      event: 'status_change';
      loadingStatus: StatsigLoadingStatus;
    }
  | {
      event: 'error';
      error: unknown;
    }
  | {
      event: 'logs_flushed';
      events: Record<string, unknown>[];
    }
  | {
      event: 'gate_evaluation';
      gate: FeatureGate;
    }
  | {
      event: 'dynamic_config_evaluation';
      dynamicConfig: DynamicConfig;
    }
  | {
      event: 'experiment_evaluation';
      experiment: Experiment;
    }
  | {
      event: 'layer_evaluation';
      layer: Layer;
    };

export type StatsigClientEventCallback = (data: StatsigClientEventData) => void;

export interface StatsigClientEventEmitterInterface {
  readonly loadingStatus: StatsigLoadingStatus;

  on(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
  off(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
}
