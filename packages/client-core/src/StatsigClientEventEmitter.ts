import { DataAdapterResult } from './StatsigDataAdapter';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { Flatten } from './UtitlityTypes';

export type StatsigLoadingStatus = 'Uninitialized' | 'Loading' | 'Ready';

type EventNameToEventDataMap = {
  values_updated: {
    status: StatsigLoadingStatus;
    values: DataAdapterResult | null;
  };
  error: { error: unknown };
  logs_flushed: { events: Record<string, unknown>[] };

  gate_evaluation: { gate: FeatureGate };
  dynamic_config_evaluation: { dynamicConfig: DynamicConfig };
  experiment_evaluation: { experiment: Experiment };
  layer_evaluation: { layer: Layer };
};

/**
 * Type representing various events emitted by a Statsig client.
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
export type StatsigClientEvent = Flatten<
  {
    [K in keyof EventNameToEventDataMap]: {
      name: K;
    } & EventNameToEventDataMap[K];
  }[keyof EventNameToEventDataMap]
>;

export type StatsigClientEventName = StatsigClientEvent['name'] | '*';

export type StatsigClientEventCallback<T extends StatsigClientEventName> = (
  event: T extends '*'
    ? StatsigClientEvent
    : Extract<StatsigClientEvent, { name: T }>,
) => void;

export interface StatsigClientEventEmitterInterface {
  readonly loadingStatus: StatsigLoadingStatus;

  on<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void;
  off<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void;
}
