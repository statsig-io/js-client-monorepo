import { DataAdapterResult } from './StatsigDataAdapter';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';

export type StatsigLoadingStatus = 'Uninitialized' | 'Loading' | 'Ready';

/**
 * All the possible events emitted from a Statsig client.
 *
 * `values_updated` - When the Statsig clients internal values change as the result of an initialize/update operation.
 *
 * `error` - When an unexpected error occurs within the Statsig client.
 *
 * `logs_flushed` - When queued StatsigEvents are flushed to Statsig servers.
 *
 * `gate_evaluation` - Fired when any gate is checked from the Statsig client.
 *
 * `dynamic_config_evaluation` - Fired when any dyanamic config is checked from the Statsig client.
 *
 * `experiment_evaluation` - Fired when any experiment is checked from the Statsig client.
 *
 * `layer_evaluation` - Fired when any layer is checked from the Statsig client.
 */
export type StatsigClientEvent =
  | 'values_updated'
  | 'error'
  | 'logs_flushed'
  | 'gate_evaluation'
  | 'dynamic_config_evaluation'
  | 'experiment_evaluation'
  | 'layer_evaluation';

/**
 * Type representing various events emitted by a Statsig client.
 */
export type StatsigClientEventData = {
  event: StatsigClientEvent;
} & (
  | {
      event: 'values_updated';
      status: StatsigLoadingStatus;
      values: DataAdapterResult | null;
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
    }
);

export type StatsigClientEventCallback = (data: StatsigClientEventData) => void;

export interface StatsigClientEventEmitterInterface {
  readonly loadingStatus: StatsigLoadingStatus;

  on(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
  off(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
}
