import './$_StatsigGlobal';
import { StatsigClientInterface } from './ClientInterfaces';
import { ErrorBoundary } from './ErrorBoundary';
import { EvaluationOptionsCommon } from './EvaluationOptions';
import { EventLogger } from './EventLogger';
import { Log, LogLevel } from './Log';
import { NetworkCore } from './NetworkCore';
import { OverrideAdapter } from './OverrideAdapter';
import { SessionID } from './SessionID';
import { StableID } from './StableID';
import {
  AnyStatsigClientEventListener,
  StatsigClientEvent,
  StatsigClientEventCallback,
  StatsigClientEventEmitterInterface,
  StatsigClientEventName,
  StatsigLoadingStatus,
} from './StatsigClientEventEmitter';
import {
  DataAdapterResult,
  EvaluationsDataAdapter,
  SpecsDataAdapter,
} from './StatsigDataAdapter';
import { StatsigEventInternal } from './StatsigEvent';
import {
  StatsigOptionsCommon,
  StatsigRuntimeMutableOptions,
} from './StatsigOptionsCommon';
import { Storage } from './StorageProvider';

type EventListenersMap = {
  [K in StatsigClientEventName]: StatsigClientEventCallback<K>[];
};

type InternalStatsigClientEventCallback = object & {
  __isInternal: true;
};

export type StatsigClientEmitEventFunc = (event: StatsigClientEvent) => void;

export type StatsigContext = {
  sdkKey: string;
  options: StatsigOptionsCommon;
  sessionID: string;
  values: unknown;
};

export abstract class StatsigClientBase<
  TAdapter extends EvaluationsDataAdapter | SpecsDataAdapter,
> implements StatsigClientEventEmitterInterface
{
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';
  readonly dataAdapter: TAdapter;

  protected readonly _sdkKey: string;
  protected readonly _options: StatsigOptionsCommon;
  protected readonly _errorBoundary: ErrorBoundary;
  protected readonly _logger: EventLogger;
  protected readonly _overrideAdapter: OverrideAdapter | null;

  private _listeners = {} as EventListenersMap;

  constructor(
    sdkKey: string,
    adapter: TAdapter,
    network: NetworkCore,
    options: StatsigOptionsCommon | null,
  ) {
    this._sdkKey = sdkKey;
    this._options = options ?? {};

    options?.disableStorage && Storage._setDisabled(true);
    options?.overrideStableID &&
      StableID.setOverride(options.overrideStableID, sdkKey);

    Log.level = options?.logLevel ?? LogLevel.Warn;

    this._overrideAdapter = options?.overrideAdapter ?? null;
    this._logger = new EventLogger(
      sdkKey,
      this._emit.bind(this),
      network,
      options,
    );
    SessionID._setEmitFunction(() => {
      this._emit({ name: 'session_expired' });
    }, sdkKey);
    this._errorBoundary = new ErrorBoundary(sdkKey);

    const statsigGlobal = __STATSIG__ ?? {};
    const instances = statsigGlobal.instances ?? {};
    const inst = this as unknown as StatsigClientInterface;
    instances[sdkKey] = inst;
    statsigGlobal.lastInstance = inst;
    statsigGlobal.instances = instances;
    __STATSIG__ = statsigGlobal;

    this.dataAdapter = adapter;
    this.dataAdapter.attach(sdkKey, options);
  }

  /**
   * Updates runtime configuration options for the SDK, allowing toggling of certain behaviors such as logging and storage to comply with user preferences or regulations such as GDPR.
   *
   * @param {StatsigRuntimeMutableOptions} options - The configuration options that dictate the runtime behavior of the SDK.
   */
  updateRuntimeOptions(options: StatsigRuntimeMutableOptions): void {
    if (options.disableLogging != null) {
      this._options.disableLogging = options.disableLogging;
      this._logger.setLoggingDisabled(options.disableLogging);
    }

    if (options.disableStorage != null) {
      this._options.disableStorage = options.disableStorage;
      Storage._setDisabled(options.disableStorage);
    }
  }

  /**
   * Flushes any currently queued events.
   */
  flush(): Promise<void> {
    return this._logger.flush();
  }

  /**
   * Gracefully shuts down the SDK, ensuring that all pending events are send before the SDK stops.
   * This function emits a 'pre_shutdown' event and then waits for the logger to complete its shutdown process.
   *
   * @returns {Promise<void>} A promise that resolves when all shutdown procedures, including logging shutdown, have been completed.
   */
  async shutdown(): Promise<void> {
    this._emit({ name: 'pre_shutdown' });
    await this._logger.shutdown();
  }

  /**
   * Subscribes a callback function to a specific {@link StatsigClientEvent} or all StatsigClientEvents if the wildcard '*' is used.
   * Once subscribed, the listener callback will be invoked whenever the specified event is emitted.
   *
   * @param {StatsigClientEventName} event - The name of the event to subscribe to, or '*' to subscribe to all events.
   * @param {StatsigClientEventCallback<T>} listener - The callback function to execute when the event occurs. The function receives event-specific data as its parameter.
   * @see {@link off} for unsubscribing from events.
   */
  on<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  /**
   * Unsubscribes a previously registered callback function from a specific {@link StatsigClientEvent} or all StatsigClientEvents if the wildcard '*' is used.
   *
   * @param {StatsigClientEventName} event - The name of the event from which to unsubscribe, or '*' to unsubscribe from all events.
   * @param {StatsigClientEventCallback<T>} listener - The callback function to remove from the event's notification list.
   * @see {@link on} for subscribing to events.
   */
  off<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void {
    if (this._listeners[event]) {
      const index = this._listeners[event].indexOf(listener);
      if (index !== -1) {
        this._listeners[event].splice(index, 1);
      }
    }
  }

  __on<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void {
    (listener as InternalStatsigClientEventCallback).__isInternal = true;
    this.on(event, listener);
  }

  protected _emit(event: StatsigClientEvent): void {
    const barrier = (listener: AnyStatsigClientEventListener) => {
      try {
        listener(event);
      } catch (error) {
        if (
          (listener as InternalStatsigClientEventCallback).__isInternal === true
        ) {
          this._errorBoundary.logError(`_emit:${event.name}`, error);
          return;
        }

        Log.error(
          `An error occurred in a StatsigClientEvent listener. This is not an issue with Statsig.`,
          event,
        );
      }
    };

    if (this._listeners[event.name]) {
      this._listeners[event.name].forEach((l) =>
        barrier(l as AnyStatsigClientEventListener),
      );
    }

    this._listeners['*']?.forEach(barrier);
  }

  protected _setStatus(
    newStatus: StatsigLoadingStatus,
    values: DataAdapterResult | null,
  ): void {
    this.loadingStatus = newStatus;
    this._emit({ name: 'values_updated', status: newStatus, values });
  }

  protected _enqueueExposure(
    name: string,
    exposure: StatsigEventInternal,
    options?: EvaluationOptionsCommon,
  ): void {
    if (options?.disableExposureLog === true) {
      this._logger.incrementNonExposureCount(name);
      return;
    }

    this._logger.enqueue(exposure);
  }
}
