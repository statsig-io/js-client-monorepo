import './$_StatsigGlobal';
import { StatsigClientInterface } from './ClientInterfaces';
import { ErrorBoundary } from './ErrorBoundary';
import { EvaluationOptionsCommon } from './EvaluationOptions';
import { EventLogger } from './EventLogger';
import { Log, LogLevel } from './Log';
import { NetworkCore } from './NetworkCore';
import { OverrideAdapter } from './OverrideAdapter';
import { StableID } from './StableID';
import {
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

    options?.disableStorage && Storage.setDisabled(true);
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
    this._errorBoundary = new ErrorBoundary(sdkKey);

    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.instances ?? {};
    instances[sdkKey] = this as unknown as StatsigClientInterface;
    __STATSIG__.instances = instances;

    this.dataAdapter = adapter;
    this.dataAdapter.attach(sdkKey, options);
  }

  updateRuntimeOptions(options: StatsigRuntimeMutableOptions): void {
    if (options.disableLogging != null) {
      this._options.disableLogging = options.disableLogging;
      this._logger.setLoggingDisabled(options.disableLogging);
    }

    if (options.disableStorage != null) {
      this._options.disableStorage = options.disableStorage;
      Storage.setDisabled(options.disableStorage);
    }
  }

  flush(): Promise<void> {
    return this._logger.flush();
  }

  async shutdown(): Promise<void> {
    this._emit({ name: 'pre_shutdown' });
    await this._logger.shutdown();
  }

  on<T extends StatsigClientEventName>(
    event: T,
    listener: StatsigClientEventCallback<T>,
  ): void {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

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

  protected _emit(event: StatsigClientEvent): void {
    const barrier = (
      listener: StatsigClientEventCallback<typeof event.name>,
    ) => {
      try {
        listener(event);
      } catch (error) {
        Log.error(
          `An error occurred in a StatsigClientEvent listener. This is not an issue with Statsig.`,
          event,
        );
      }
    };

    if (this._listeners[event.name]) {
      this._listeners[event.name].forEach((l) =>
        barrier(l as StatsigClientEventCallback<typeof event.name>),
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
