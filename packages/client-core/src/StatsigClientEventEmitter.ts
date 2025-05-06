import { DataAdapterResult } from './StatsigDataAdapter';
import { StatsigEvent } from './StatsigEvent';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { Flatten } from './TypingUtils';

export type StatsigLoadingStatus = 'Uninitialized' | 'Loading' | 'Ready';

export const ErrorTag = {
  NetworkError: 'NetworkError',
} as const;

export type ErrorTag = (typeof ErrorTag)[keyof typeof ErrorTag];

type ErrorEventData =
  | {
      error: unknown;
      tag: ErrorTag | string;
    }
  | {
      error: unknown;
      tag: 'NetworkError';
      requestArgs: Record<string, unknown>;
    };

type EventNameToEventDataMap = {
  values_updated: {
    status: StatsigLoadingStatus;
    values: DataAdapterResult | null;
  };
  session_expired: object;
  error: ErrorEventData;
  pre_logs_flushed: { events: Record<string, unknown>[] };
  logs_flushed: { events: Record<string, unknown>[] };
  pre_shutdown: object;
  initialization_failure: object;

  gate_evaluation: { gate: FeatureGate };
  dynamic_config_evaluation: { dynamicConfig: DynamicConfig };
  experiment_evaluation: { experiment: Experiment };
  layer_evaluation: { layer: Layer };
  log_event_called: { event: StatsigEvent };
};

/**
 * Type representing various events emitted by a Statsig client.
 *
 * `values_updated` - When the Statsig clients internal values change as the result of an initialize/update operation.
 *
 * `session_expired` - When the current session has expired.
 *
 * `error` - When an unexpected error occurs within the Statsig client.
 *
 * `pre_logs_flushed` - Fired just before queued StatsigEvents are flushed to Statsig servers.
 *
 * `logs_flushed` - When queued StatsigEvents are flushed to Statsig servers.
 *
 * `pre_shutdown` - Fired just before the SDK is shutdown
 *
 * `initialization_failure` - Fired when the client fails to initialize.
 *
 * `gate_evaluation` - Fired when any gate is checked from the Statsig client.
 *
 * `dynamic_config_evaluation` - Fired when any dyanamic config is checked from the Statsig client.
 *
 * `experiment_evaluation` - Fired when any experiment is checked from the Statsig client.
 *
 * `layer_evaluation` - Fired when any layer is checked from the Statsig client.
 *
 * `log_event_called` - Fired when log event is called.
 */
export type AnyStatsigClientEvent = Flatten<
  {
    [K in keyof EventNameToEventDataMap]: {
      name: K;
    } & EventNameToEventDataMap[K];
  }[keyof EventNameToEventDataMap]
>;

export type StatsigClientEvent<T> = Extract<AnyStatsigClientEvent, { name: T }>;

export type AnyStatsigClientEventListener =
  StatsigClientEventCallback<StatsigClientEventName>;

export type StatsigClientEventName = AnyStatsigClientEvent['name'] | '*';

export type StatsigClientEventCallback<T extends StatsigClientEventName> = (
  event: T extends '*' ? AnyStatsigClientEvent : StatsigClientEvent<T>,
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

  /**
   * (Statsig Use Only) - Same as .on() but logs errors to sdk_exception
   */
  $on<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void;

  /**
   * (Statsig Use Only) - Emit StatsigClientEvents
   */
  $emt(event: AnyStatsigClientEvent): void;
}
