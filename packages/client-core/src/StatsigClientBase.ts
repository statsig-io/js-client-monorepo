import './$_StatsigGlobal';
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
  StatsigClientEventData,
  StatsigClientEventEmitterInterface,
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

export type StatsigClientEmitEventFunc = (data: StatsigClientEventData) => void;

export abstract class StatsigClientBase<
  TAdapter extends EvaluationsDataAdapter | SpecsDataAdapter,
> implements StatsigClientEventEmitterInterface
{
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';
  readonly dataAdapter: TAdapter;

  protected readonly _errorBoundary: ErrorBoundary;
  protected readonly _logger: EventLogger;
  protected readonly _overrideAdapter: OverrideAdapter | null;

  private _listeners: Record<string, StatsigClientEventCallback[]> = {};

  constructor(
    protected readonly _sdkKey: string,
    adapter: TAdapter,
    network: NetworkCore,
    options: StatsigOptionsCommon | null,
  ) {
    options?.disableStorage && Storage.setDisabled(true);
    options?.overrideStableID &&
      StableID.setOverride(options.overrideStableID, _sdkKey);

    Log.level = options?.logLevel ?? LogLevel.Warn;

    this._overrideAdapter = options?.overrideAdapter ?? null;
    this._logger = new EventLogger(
      _sdkKey,
      this._emit.bind(this),
      network,
      options,
    );
    this._errorBoundary = new ErrorBoundary(_sdkKey);

    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.instances ?? new Set();
    instances.add(this);
    __STATSIG__.instances = instances;

    this.dataAdapter = adapter;
    this.dataAdapter.attach(_sdkKey, options);
  }

  updateRuntimeOptions(options: StatsigRuntimeMutableOptions): void {
    if (options.disableLogging != null) {
      this._logger.setLoggingDisabled(options.disableLogging);
    }

    if (options.disableStorage != null) {
      Storage.setDisabled(options.disableStorage);
    }
  }

  flush(): Promise<void> {
    return this._logger.flush();
  }

  on(
    event: StatsigClientEvent | '*',
    listener: StatsigClientEventCallback,
  ): void {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  off(
    event: StatsigClientEvent | '*',
    listener: StatsigClientEventCallback,
  ): void {
    if (this._listeners[event]) {
      const index = this._listeners[event].indexOf(listener);
      if (index !== -1) {
        this._listeners[event].splice(index, 1);
      }
    }
  }

  protected _emit(data: StatsigClientEventData): void {
    if (this._listeners[data.event]) {
      this._listeners[data.event].forEach((listener) => listener(data));
    }

    this._listeners['*']?.forEach((listener) => listener(data));
  }

  protected _setStatus(
    newStatus: StatsigLoadingStatus,
    values: DataAdapterResult | null,
  ): void {
    this.loadingStatus = newStatus;
    this._emit({ event: 'values_updated', status: newStatus, values });
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
