import './$_StatsigGlobal';
import { _getStatsigGlobal } from './$_StatsigGlobal';
import { StatsigClientInterface } from './ClientInterfaces';
import { ErrorBoundary } from './ErrorBoundary';
import {
  AnyEvaluationOptions,
  EvaluationOptionsCommon,
} from './EvaluationOptions';
import { EventLogger } from './EventLogger';
import { Log } from './Log';
import { createMemoKey } from './MemoKey';
import { NetworkCore } from './NetworkCore';
import { OverrideAdapter } from './OverrideAdapter';
import { _isServerEnv } from './SafeJs';
import { StatsigSession } from './SessionID';
import {
  AnyStatsigClientEvent,
  AnyStatsigClientEventListener,
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
  AnyStatsigOptions,
  StatsigRuntimeMutableOptions,
} from './StatsigOptionsCommon';
import { Storage, StorageProvider } from './StorageProvider';

type EventListenersMap = {
  [K in StatsigClientEventName]: StatsigClientEventCallback<K>[];
};

type InternalStatsigClientEventCallback = object & {
  __isInternal: true;
};

const MAX_MEMO_CACHE_SIZE = 3000;

export type StatsigClientEmitEventFunc = (event: AnyStatsigClientEvent) => void;

export type StatsigContext = {
  sdkKey: string;
  options: AnyStatsigOptions;
  sessionID: string;
  values: unknown;
};

export abstract class StatsigClientBase<
  TAdapter extends EvaluationsDataAdapter | SpecsDataAdapter,
> implements StatsigClientEventEmitterInterface
{
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';
  public readonly dataAdapter: TAdapter;
  public readonly overrideAdapter: OverrideAdapter | null;
  public readonly storageProvider: StorageProvider;

  protected readonly _sdkKey: string;
  protected readonly _options: AnyStatsigOptions;
  protected readonly _errorBoundary: ErrorBoundary;
  protected readonly _logger: EventLogger;
  protected _initializePromise: Promise<void> | null = null;
  protected _memoCache: Record<string, unknown>;

  private _listeners = {} as EventListenersMap;

  constructor(
    sdkKey: string,
    adapter: TAdapter,
    network: NetworkCore,
    options: AnyStatsigOptions | null,
  ) {
    const emitter = this.$emt.bind(this);

    options?.logLevel != null && (Log.level = options.logLevel);
    options?.disableStorage && Storage._setDisabled(true);
    options?.initialSessionID &&
      StatsigSession.overrideInitialSessionID(options.initialSessionID, sdkKey);
    options?.storageProvider && Storage._setProvider(options.storageProvider);

    this._sdkKey = sdkKey;
    this._options = options ?? {};
    this._memoCache = {};
    this.overrideAdapter = options?.overrideAdapter ?? null;
    this._logger = new EventLogger(sdkKey, emitter, network, options);

    this._errorBoundary = new ErrorBoundary(sdkKey, options, emitter);
    this._errorBoundary.wrap(this);
    this._errorBoundary.wrap(adapter);
    this._errorBoundary.wrap(this._logger);
    network.setErrorBoundary(this._errorBoundary);

    this.dataAdapter = adapter;
    this.dataAdapter.attach(sdkKey, options);
    this.storageProvider = Storage;

    this._primeReadyRipcord();

    _assignGlobalInstance(sdkKey, this as unknown as StatsigClientInterface);
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
    this.$emt({ name: 'pre_shutdown' });
    this._setStatus('Uninitialized', null);
    this._initializePromise = null;
    await this._logger.stop();
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

  $on<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void {
    (listener as InternalStatsigClientEventCallback).__isInternal = true;
    this.on(event, listener);
  }

  $emt(event: AnyStatsigClientEvent): void {
    const barrier = (listener: AnyStatsigClientEventListener) => {
      try {
        listener(event);
      } catch (error) {
        if (
          (listener as InternalStatsigClientEventCallback).__isInternal === true
        ) {
          this._errorBoundary.logError(`__emit:${event.name}`, error);
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
    this._memoCache = {};
    this.$emt({ name: 'values_updated', status: newStatus, values });
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

  protected _memoize<T, O extends AnyEvaluationOptions>(
    fn: (name: string, options?: O) => T,
  ): (name: string, options?: O) => T {
    return (name: string, options?: O) => {
      const memoKey = createMemoKey(name, options);
      if (!memoKey) {
        return fn(name, options);
      }

      if (!(memoKey in this._memoCache)) {
        if (Object.keys(this._memoCache).length >= MAX_MEMO_CACHE_SIZE) {
          this._memoCache = {};
        }

        this._memoCache[memoKey] = fn(name, options);
      }

      return this._memoCache[memoKey] as T;
    };
  }

  protected abstract _primeReadyRipcord(): void;
}

function _assignGlobalInstance(sdkKey: string, client: StatsigClientInterface) {
  if (_isServerEnv()) {
    return;
  }

  const statsigGlobal = _getStatsigGlobal();
  const instances = statsigGlobal.instances ?? {};
  const inst = client;

  if (instances[sdkKey] != null) {
    Log.warn(
      'Creating multiple Statsig clients with the same SDK key can lead to unexpected behavior. Multi-instance support requires different SDK keys.',
    );
  }

  instances[sdkKey] = inst;
  if (!statsigGlobal.firstInstance) {
    statsigGlobal.firstInstance = inst;
  }
  statsigGlobal.instances = instances;
  __STATSIG__ = statsigGlobal;
}
